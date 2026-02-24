import secrets

def generate_otp(length=6):
    """Generates a random OTP of the specified length."""
    range_start = 10**(length - 1)
    range_end = (10**length) - 1
    return str(secrets.randbelow(range_end - range_start + 1) + range_start)