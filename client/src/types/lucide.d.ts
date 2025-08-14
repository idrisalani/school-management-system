// Create: client/src/types/lucide.d.ts
declare module 'lucide-react' {
  interface LucideProps {
    size?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
  }
  
  export const DollarSign: React.FC<LucideProps>;
  export const TrendingUp: React.FC<LucideProps>;
  export const TrendingDown: React.FC<LucideProps>;
  // Add other icons as needed
}