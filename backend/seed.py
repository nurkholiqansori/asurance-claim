import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.core.security import hash_password
import app.models  # noqa

Base.metadata.create_all(bind=engine)

DUMMY_USERS = [
    {"name": "Master User",     "email": "user@demo.com",     "password": "password123", "role": UserRole.user},
    {"name": "Bob Verifier",   "email": "verifier@demo.com", "password": "password123", "role": UserRole.verifier},
    {"name": "Carol Approver", "email": "approver@demo.com", "password": "password123", "role": UserRole.approver},
]

db = SessionLocal()
try:
    for u in DUMMY_USERS:
        if not db.query(User).filter(User.email == u["email"]).first():
            db.add(User(name=u["name"], email=u["email"], password=hash_password(u["password"]), role=u["role"]))
            print(f"  ✅ Created: {u['email']} ({u['role']})")
        else:
            print(f"  ⏭  Exists:  {u['email']}")
    db.commit()
    print("\n🎉 Seed complete!")
    print("\nDemo Accounts:")
    print("  user@demo.com     / password123")
    print("  verifier@demo.com / password123")
    print("  approver@demo.com / password123")
finally:
    db.close()
