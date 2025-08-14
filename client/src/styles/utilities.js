// Import this file after Tailwind is initialized
const utilities = {
    btn: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    "btn-primary": "bg-primary text-primary-foreground hover:bg-primary/90",
    "btn-secondary": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    "btn-destructive": "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    card: "rounded-lg border bg-card text-card-foreground shadow-sm",
    // Add other utility classes as needed
  };
  
  export default utilities;