import Foundation
import Vision
import CoreImage
import AppKit

// Détoure le sujet principal d'une photo via Vision (macOS 14+) et écrit un PNG RGBA.
// usage: cutout <entrée.jpg> <sortie.png>

guard CommandLine.arguments.count == 3 else {
    FileHandle.standardError.write("usage: cutout <in> <out>\n".data(using: .utf8)!)
    exit(2)
}
let inURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let src = CIImage(contentsOf: inURL) else {
    FileHandle.standardError.write("lecture impossible: \(inURL.path)\n".data(using: .utf8)!)
    exit(1)
}

let handler = VNImageRequestHandler(ciImage: src, options: [:])
let req = VNGenerateForegroundInstanceMaskRequest()

do {
    try handler.perform([req])
} catch {
    FileHandle.standardError.write("Vision a échoué: \(error)\n".data(using: .utf8)!)
    exit(1)
}

guard let obs = req.results?.first, !obs.allInstances.isEmpty else {
    FileHandle.standardError.write("aucun sujet détecté\n".data(using: .utf8)!)
    exit(3)
}

// toutes les instances de premier plan, fond rendu transparent
let buf: CVPixelBuffer
do {
    buf = try obs.generateMaskedImage(ofInstances: obs.allInstances,
                                      from: handler,
                                      croppedToInstancesExtent: true)
} catch {
    FileHandle.standardError.write("génération du masque échouée: \(error)\n".data(using: .utf8)!)
    exit(1)
}

let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
guard let cs = CGColorSpace(name: CGColorSpace.sRGB) else { exit(1) }
do {
    try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: cs)
} catch {
    FileHandle.standardError.write("écriture PNG échouée: \(error)\n".data(using: .utf8)!)
    exit(1)
}
print("ok \(outURL.lastPathComponent) instances=\(obs.allInstances.count) \(Int(out.extent.width))x\(Int(out.extent.height))")
