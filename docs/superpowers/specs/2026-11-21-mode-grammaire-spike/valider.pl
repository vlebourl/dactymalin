#!/usr/bin/perl
# usage: valider.pl <mots-interdits> <phrase>  -> sort 0 si OK, sinon affiche la raison et sort 1
use strict; use utf8; use open qw(:std :utf8);
my ($fichier, $phrase) = map { utf8::decode($_); $_ } @ARGV;
open my $fh, '<', $fichier or die; chomp(my @interdits = grep { /\S/ } <$fh>);
if ($phrase =~ /\n/) { print "plusieurs lignes\n"; exit 1 }
my @mots = split /[\s']+/, $phrase;
if (@mots > 15) { print "trop longue (".scalar(@mots)." mots)\n"; exit 1 }
for my $m (@interdits) {
  if ($phrase =~ /(?<!\p{L})\Q$m\E(?!\p{L})/i) { print "mot interdit : $m\n"; exit 1 }
}
exit 0;
