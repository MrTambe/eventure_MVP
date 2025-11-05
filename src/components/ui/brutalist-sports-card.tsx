import React from 'react';
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface BrutalistSportsCardProps {
  sport: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  icon: React.ComponentType<any>;
  viewPath?: string;
}

const BrutalistSportsCard: React.FC<BrutalistSportsCardProps> = ({ sport, title, date, time, venue, icon: Icon, viewPath }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    console.log("View Details clicked for:", title);
    toast.info(`Opening details for ${title}...`);
    // Prefer explicit viewPath when provided
    if (viewPath) {
      navigate(viewPath);
      return;
    }
    const eventSlug = sport.toLowerCase().replace(/\s+/g, '-');
    navigate(`/event/${eventSlug}`);
  };
  
  const handleRegisterNow = () => {
    console.log("Register Now clicked for:", title);
    toast.success(`Successfully registered for ${title}!`);
  };

  return (
    <>
      <style>{`
        .brutalist-card {
          width: 320px;
          border: 4px solid #000;
          background-color: #fff;
          padding: 1.5rem;
          box-shadow: 10px 10px 0 #000;
          font-family: "Arial", sans-serif;
          margin: 1rem;
          pointer-events: auto;
        }
        .brutalist-card__header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
        }
        .brutalist-card__icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000;
          padding: 0.5rem;
          width: 50px;
          height: 50px;
          color: #fff;
        }
        .brutalist-card__alert {
          font-weight: 900;
          color: #000;
          font-size: 1.5rem;
          text-transform: uppercase;
        }
        .brutalist-card__message {
          margin-top: 1rem;
          color: #000;
          font-size: 0.9rem;
          line-height: 1.4;
          border-bottom: 2px solid #000;
          padding-bottom: 1rem;
          font-weight: 600;
        }
        .brutalist-card__actions { margin-top: 1rem; }
        .brutalist-card__button {
          display: block;
          width: 100%;
          padding: 0.75rem;
          text-align: center;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          border: 3px solid #000;
          background-color: #fff;
          color: #000;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 5px 5px 0 #000;
          overflow: hidden;
          text-decoration: none;
          margin-bottom: 1rem;
          cursor: pointer !important;
          pointer-events: auto !important;
          user-select: none;
          z-index: 100;
        }
        .brutalist-card__button--read {
          background-color: #000;
          color: #fff;
        }
        .brutalist-card__button::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: all 0.6s;
        }
        .brutalist-card__button:hover::before { left: 100%; }
        .brutalist-card__button:hover {
          transform: translate(-2px, -2px);
          box-shadow: 7px 7px 0 #000;
        }
        .brutalist-card__button--mark:hover {
          background-color: #296fbb;
          border-color: #296fbb;
          color: #fff;
          box-shadow: 7px 7px 0 #004280;
        }
        .brutalist-card__button--read:hover {
          background-color: #ff0000;
          border-color: #ff0000;
          color: #fff;
          box-shadow: 7px 7px 0 #800000;
        }
        .brutalist-card__button:active {
          transform: translate(5px, 5px);
          box-shadow: none;
        }
      `}</style>

      <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
        <div className="brutalist-card" style={{ pointerEvents: 'auto', position: 'relative' }}>
          <div className="brutalist-card__header">
            <div className="brutalist-card__icon">
              <Icon size={32} />
            </div>
            <div className="brutalist-card__alert">{sport}</div>
          </div>
          <div className="brutalist-card__message">
            <p className="font-bold text-lg">{title}</p>
            <p>Date: {date}</p>
            <p>Time: {time}</p>
            <p>Venue: {venue}</p>
          </div>
          <div className="brutalist-card__actions" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100 }}>
            <button 
              className="brutalist-card__button brutalist-card__button--mark" 
              onClick={handleViewDetails}
              style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 101 }}
              type="button"
            >
              View Details
            </button>
            <button 
              className="brutalist-card__button brutalist-card__button--read" 
              onClick={handleRegisterNow}
              style={{ pointerEvents: 'auto', cursor: 'pointer', position: 'relative', zIndex: 101 }}
              type="button"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export { BrutalistSportsCard };