import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-surface-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:pointer-events-none group"
            >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <span className="text-sm font-medium text-muted-foreground px-4">
                Page <span className="text-foreground font-bold">{currentPage}</span> of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-surface-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:pointer-events-none group"
            >
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
        </div>
    );
}
