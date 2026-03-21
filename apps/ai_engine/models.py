from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class PricingRule(Base):
    __tablename__ = 'pricing_rules'

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    base_rate_per_km = Column(Float, nullable=False)
    min_fare = Column(Float, nullable=False)
    night_multiplier = Column(Float, default=1.5)
    peak_multiplier = Column(Float, default=2.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DemandMetric(Base):
    __tablename__ = 'demand_metrics'

    id = Column(Integer, primary_key=True, index=True)
    location_geohash = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    demand_count = Column(Integer) # Number of load requests
    supply_count = Column(Integer) # Number of available drivers
    surge_multiplier = Column(Float)

class MatchLog(Base):
    __tablename__ = 'match_logs'

    id = Column(Integer, primary_key=True, index=True)
    load_id = Column(String, index=True) # Reference to MongoDB Load ID
    driver_id = Column(String, index=True) # Reference to MongoDB Driver ID
    match_score = Column(Float)
    algorithm_version = Column(String)
    features_used = Column(JSON) # Snapshot of features used for matching
    created_at = Column(DateTime, default=datetime.utcnow)
