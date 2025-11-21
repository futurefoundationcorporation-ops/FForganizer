import React from 'react';

export const FolderSkeletonLoader = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-lg h-32 flex flex-col justify-between shadow-sm">
                <div>
                    <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-muted/50 rounded w-1/2"></div>
                </div>
                <div className="flex justify-between items-end mt-4">
                    <div className="h-4 w-16 bg-muted/30 rounded"></div>
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                </div>
            </div>
        ))}
    </div>
);
