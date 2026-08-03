"""
User / Persona API (faker-style entry points)

Thin, ergonomic wrappers around the core generator that mirror the
"users()" shape shown in the README sample output:

    >>> from indian_fakedata import generate_user, generate_users, generate_persona
    >>> user = generate_user(seed=7)                 # one profile (README sample shape)
    >>> users = generate_users(count=5, seed="011")  # many profiles, one seed
    >>> dev = generate_user(highly_educated=True, state="Karnataka")
    >>> out = generate_persona(seed="011")           # {user, persona}
"""

from indian_fakedata.utils.generator import generate
from indian_fakedata.utils.agent import generate_agent_persona


def _to_constraints(constraints=None, highly_educated=False, gender=None, marital_status=None):
    merged = dict(constraints) if constraints else {}
    if highly_educated:
        merged["education"] = "postgraduate"
    if gender:
        merged["gender"] = gender
    if marital_status:
        merged["maritalStatus"] = marital_status
    return merged


def generate_user(seed=None, constraints=None, highly_educated=False,
                  gender=None, marital_status=None, include_probability_metrics=True,
                  data_dir=None):
    """Generate a single user — mirroring the README "Output Sample" shape."""
    profiles = generate(
        count=1,
        seed=seed,
        constraints=_to_constraints(constraints, highly_educated, gender, marital_status),
        include_probability_metrics=include_probability_metrics,
    )
    return profiles[0]


def generate_users(count=1, seed=None, constraints=None, highly_educated=False,
                   gender=None, marital_status=None, include_probability_metrics=True,
                   data_dir=None):
    """Generate `count` users driven by a single seed."""
    return generate(
        count=count,
        seed=seed,
        constraints=_to_constraints(constraints, highly_educated, gender, marital_status),
        include_probability_metrics=include_probability_metrics,
    )


def generate_persona(seed=None, constraints=None, highly_educated=False,
                     gender=None, marital_status=None, include_probability_metrics=True,
                     data_dir=None):
    """Generate a user plus its LLM-ready agent persona in one call."""
    user = generate_user(
        seed=seed,
        constraints=constraints,
        highly_educated=highly_educated,
        gender=gender,
        marital_status=marital_status,
        include_probability_metrics=include_probability_metrics,
        data_dir=data_dir,
    )
    persona = generate_agent_persona(user)
    return {"user": user, "persona": persona}