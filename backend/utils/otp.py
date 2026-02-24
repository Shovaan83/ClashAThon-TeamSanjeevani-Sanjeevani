import secrets

def generate_otp(length=6):
    """Generates a random OTP of the specified length."""
    return "".join(str(secrets.randbelow(10)) for _ in range(length))