import React from 'react';
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Calendar, Clock, MapPin } from "lucide-react";

interface BrutalistSportsCardProps {
  sport: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  icon: React.ComponentType<any>;
  viewPath?: string;
}

const BrutalistSportsCard: React.FC<BrutalistSportsCardProps> = ({ 
  sport, 
  title, 
  date, 
  time, 
  venue, 
  icon: Icon, 
  viewPath 
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    console.log("View Details clicked for:", title);
    toast.info(`Opening details for ${title}...`);
    if (viewPath) {
      navigate(viewPath);
    }
  };
  
  const handleRegisterNow = () => {
    console.log("Register Now clicked for:", title);
    toast.success(`Successfully registered for ${title}!`);
  };

  return (
    <>
      <style>{`
        .event-card {
          width: 320px;
          padding: 20px;
          background: #fff;
          border: 6px solid #000;
          box-shadow: 12px 12px 0 #000;
          transition: transform 0.3s, box-shadow 0.3s;
          margin: 1rem;
          position: relative;
          z-index: 10;
        }
        
        .dark .event-card {
          background: #1a1a1a;
          border-color: #fff;
          box-shadow: 12px 12px 0 #fff;
        }
        
        .event-card:hover {
          transform: translate(-5px, -5px);
          box-shadow: 17px 17px 0 #000;
        }
        
        .dark .event-card:hover {
          box-shadow: 17px 17px 0 #fff;
        }
        
        .event-card__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 3px solid #000;
        }
        
        .dark .event-card__header {
          border-bottom-color: #fff;
        }
        
        .event-card__icon {
          flex-shrink: 0;
          background: #000;
          color: #fff;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .dark .event-card__icon {
          background: #fff;
          color: #000;
        }
        
        .event-card__title {
          font-size: 24px;
          font-weight: 900;
          color: #000;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          flex: 1;
        }
        
        .dark .event-card__title {
          color: #fff;
        }
        
        .event-card__title::after {
          content: "";
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: #000;
          transform: translateX(-100%);
          transition: transform 0.3s;
        }
        
        .dark .event-card__title::after {
          background-color: #fff;
        }
        
        .event-card:hover .event-card__title::after {
          transform: translateX(0);
        }
        
        .event-card__content {
          margin-bottom: 20px;
        }
        
        .event-card__detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #000;
          margin-bottom: 8px;
        }
        
        .dark .event-card__detail {
          color: #fff;
        }
        
        .event-card__detail svg {
          flex-shrink: 0;
        }
        
        .event-card__actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .event-card__button {
          border: 3px solid #000;
          background: #000;
          color: #fff;
          padding: 12px;
          font-size: 16px;
          font-weight: bold;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s;
          width: 100%;
          font-family: inherit;
        }
        
        .dark .event-card__button {
          border-color: #fff;
          background: #fff;
          color: #000;
        }
        
        .event-card__button--primary::before {
          content: "View →";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #5ad641;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(100%);
          transition: transform 0.3s;
          font-weight: bold;
        }
        
        .event-card__button--secondary::before {
          content: "Register!";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #ff6b6b;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(100%);
          transition: transform 0.3s;
          font-weight: bold;
        }
        
        .event-card__button:hover::before {
          transform: translateY(0);
        }
        
        .event-card__button:active {
          transform: scale(0.95);
        }
      `}</style>

      <div className="event-card">
        <div className="event-card__header">
          <div className="event-card__icon">
            <Icon size={24} />
          </div>
          <span className="event-card__title">{sport}</span>
        </div>
        
        <div className="event-card__content">
          <div className="event-card__detail">
            <Calendar size={16} />
            <span>{date}</span>
          </div>
          <div className="event-card__detail">
            <Clock size={16} />
            <span>{time}</span>
          </div>
          <div className="event-card__detail">
            <MapPin size={16} />
            <span>{venue}</span>
          </div>
        </div>
        
        <div className="event-card__actions">
          <button 
            className="event-card__button event-card__button--primary" 
            onClick={handleViewDetails}
            type="button"
          >
            View Details
          </button>
          <button 
            className="event-card__button event-card__button--secondary" 
            onClick={handleRegisterNow}
            type="button"
          >
            Register Now
          </button>
        </div>
      </div>
    </>
  );
}

export { BrutalistSportsCard };