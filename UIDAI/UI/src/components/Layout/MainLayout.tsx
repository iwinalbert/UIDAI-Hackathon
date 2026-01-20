import React from 'react';
import { Header } from './Header';
import { DrawingToolbar } from '../Chart/DrawingToolbar';
import { RightSidebar } from './RightSidebar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-screen bg-background text-text">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <DrawingToolbar />
                <main className="flex-1 relative overflow-hidden">
                    {children}
                </main>
                <RightSidebar />
            </div>
        </div>
    );
};
