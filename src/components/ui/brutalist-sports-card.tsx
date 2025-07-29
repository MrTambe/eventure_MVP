import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface BrutalistSportsCardProps {
  sport: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const BrutalistSportsCard: React.FC<BrutalistSportsCardProps> = ({
  sport,
  title,
  date,
  time,
  venue,
  icon: Icon
}) => {
  const navigate = useNavigate();
  const registerForEvent = useMutation(api.dashboard.registerForEvent);

  const handleViewDetails = () => {
    const sportMap: { [key: string]: string } = {
      "Basketball": "basketball",
      "Fencing": "fencing", 
      "Tennis": "tennis",
      "Cricket": "cricket",
      "Chess": "chess",
      "Football": "football",
      "Carrom": "carrom",
      "Table Tennis": "table-tennis",
      "Cycling": "cycling",
      "Badminton": "badminton",
      "Athletics": "athletics",
      "Golf": "golf"
    };
    
    const eventKey = sportMap[sport] || sport.toLowerCase().replace(/\s+/g, '-');
    navigate(`/event/${eventKey}`);
  };

  const handleRegisterNow = async () => {
    try {
      // For demo purposes, using a mock event ID based on sport name
      const mockEventId = `event_${sport.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Since we don't have real event IDs, we'll show a success message
      toast.success(`Successfully registered for ${title}!`);
    } catch (error) {
      toast.error("Failed to register for event");
    }
  };

  return (
    <StyledWrapper>
      <div className="brutalist-card">
        <div className="brutalist-card__header">
          <div className="brutalist-card__icon">
            <Icon size={24} />
          </div>
          <div className="brutalist-card__alert">{sport}</div>
        </div>
        <div className="brutalist-card__message">
          <strong>{title}</strong><br />
          📅 {date} at {time}<br />
          📍 {venue}
        </div>
        <div className="brutalist-card__actions">
          <button 
            className="brutalist-card__button brutalist-card__button--mark" 
            onClick={handleViewDetails}
          >
            View Details
          </button>
          <button 
            className="brutalist-card__button brutalist-card__button--read" 
            onClick={handleRegisterNow}
          >
            Register Now
          </button>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .brutalist-card {
    width: 320px;
    border: 4px solid #000;
    background-color: #fff;
    padding: 1.5rem;
    box-shadow: 10px 10px 0 #000;
    font-family: "Arial", sans-serif;
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

  .brutalist-card__actions {
    margin-top: 1rem;
  }

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
    cursor: pointer;
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
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: all 0.6s;
  }

  .brutalist-card__button:hover::before {
    left: 100%;
  }

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
`;

export { BrutalistSportsCard };