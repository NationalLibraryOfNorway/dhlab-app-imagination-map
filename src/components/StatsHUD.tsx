import React, { useMemo } from 'react';
import { useCorpus } from '../context/CorpusContext';
import './StatsHUD.css';

export const StatsHUD: React.FC = () => {
    const { activeBooksMetadata, allBooks, isLoading, places, totalPlaces } = useCorpus();

    const stats = useMemo(() => {
        const uniqueAuthors = new Set(activeBooksMetadata.map(b => b.author).filter(Boolean));
        const years = activeBooksMetadata.map(b => b.year).filter(y => y !== null);
        const minYear = years.length > 0 ? Math.min(...years as number[]) : 0;
        const maxYear = years.length > 0 ? Math.max(...years as number[]) : 0;
        return {
            authors: uniqueAuthors.size,
            books: activeBooksMetadata.length,
            yearString: minYear ? `${minYear} - ${maxYear}` : "n/a"
        };
    }, [activeBooksMetadata]);

    if (isLoading) {
        return (
            <div className="stats-hud-container loading">
                <span className="chip">
                    <i className="fas fa-spinner fa-spin"></i> Laster database...
                </span>
            </div>
        );
    }

    return (
        <div className="stats-hud-container">
            <div className="chip">
                <i className="fas fa-book"></i>
                <span className="chip-text">
                    <span className="chip-value">{stats.books.toLocaleString()}</span> Bøker
                </span>
            </div>
            <div className="chip">
                <i className="fas fa-user-edit"></i>
                <span className="chip-text">
                    <span className="chip-value">{stats.authors.toLocaleString()}</span> Forfattere
                </span>
            </div>
            <div className="chip">
                <i className="fas fa-calendar-alt"></i>
                <span className="chip-text">
                    {stats.yearString}
                </span>
            </div>
            <div className="chip">
                <i className="fas fa-map-marker-alt"></i>
                <span className="chip-text">
                    <span className="chip-value">{totalPlaces.toLocaleString()}</span> Steder
                    {totalPlaces > places.length && <span style={{ fontSize: '0.7em', marginLeft: 4, opacity: 0.7 }}>(Vist: {places.length})</span>}
                </span>
            </div>
            <div className="chip active-db">
                <i className="fas fa-database"></i>
                <span className="chip-text">
                    Klar ({allBooks.length.toLocaleString()})
                </span>
            </div>
        </div>
    );
};
