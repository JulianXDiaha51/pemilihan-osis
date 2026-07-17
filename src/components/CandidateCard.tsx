"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './with/ImageWithFallback';
import { Target, Lightbulb } from 'lucide-react';

interface CandidateCardProps {
  candidate: any;
  onVote: (candidateId: string) => void;
  hasVoted: boolean;
  voting: boolean;
}

export default function CandidateCard({ candidate, onVote, hasVoted, voting }: CandidateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100">
      {/* Candidate Photo */}
      <div className="relative h-64 bg-gradient-to-br from-indigo-100 to-purple-100">
        {candidate.foto_url ? (
          <ImageWithFallback
            src={candidate.foto_url}
            alt={`${candidate.nama_ketua} & ${candidate.nama_wakil}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-indigo-600 text-3xl">
                  {candidate.nama_ketua.charAt(0)}{candidate.nama_wakil.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-indigo-600 text-white border-0">
            Pasangan Calon
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">
          {candidate.nama_ketua}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          & {candidate.nama_wakil}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visi */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Visi</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {candidate.visi}
          </p>
        </div>

        {/* Misi */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm">Misi</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
            {candidate.misi}
          </p>
        </div>

        {/* Vote Button */}
        <Button
          onClick={() => onVote(candidate.id)}
          disabled={hasVoted || voting}
          className={`w-full ${
            hasVoted 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {voting ? 'Memproses...' : hasVoted ? 'Sudah Vote' : 'Vote Sekarang'}
        </Button>
      </CardContent>
    </Card>
  );
}
