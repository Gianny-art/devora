import { Business } from '@/types';
import { MapPin, Globe, Star, TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BusinessCardProps {
  business: Business;
  onClick?: () => void;
}

export function BusinessCard({ business, onClick }: BusinessCardProps) {
  const opportunityColor = business.opportunityScore && business.opportunityScore >= 7
    ? 'text-score-bad'
    : business.opportunityScore && business.opportunityScore >= 4
    ? 'text-score-average'
    : 'text-score-good';

  return (
    <div
      onClick={onClick}
      className="glass rounded-lg p-4 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {business.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{business.category}</p>
        </div>
        {business.opportunityScore && (
          <div className="flex items-center gap-1 ml-2">
            <TrendingUp className={`w-3.5 h-3.5 ${opportunityColor}`} />
            <span className={`text-sm font-mono font-bold ${opportunityColor}`}>
              {business.opportunityScore}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{business.address}</span>
        </div>
        {business.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 shrink-0 text-warning" />
            <span>{business.rating}/5</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 shrink-0" />
          {business.hasWebsite ? (
            <span className="truncate">{business.website}</span>
          ) : (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-opportunity/40 text-opportunity">
              No Website
            </Badge>
          )}
        </div>
      </div>

      {!business.hasWebsite && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <Badge variant="outline" className="text-[10px] border-opportunity/40 text-opportunity gap-1">
            <Flame className="w-2.5 h-2.5" /> High Opportunity Lead
          </Badge>
        </div>
      )}
    </div>
  );
}
