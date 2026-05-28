"""
Outcome Simulation Layer (SSPS — Layer 2)

Simulates realistic life outcomes for a generated demographic profile.
Includes a controllable bias parameter (0.0 = meritocracy, 1.0 = max
historical discrimination) enabling fairness auditing research.
"""

import math

# Bias Penalty Tables
CASTE_CREDIT_PENALTY = {
    "General": 0.0,
    "OBC":    -25.0,
    "SC":     -65.0,
    "ST":     -80.0,
}

RELIGION_CREDIT_PENALTY = {
    "hindu":    0.0,
    "jain":     0.0,
    "sikh":     0.0,
    "christian":-5.0,
    "buddhist": -15.0,
    "muslim":   -30.0,
}

CASTE_WAGE_GAP = {
    "General": 1.00,
    "OBC":    0.88,
    "SC":     0.73,
    "ST":     0.68,
}

GENDER_WAGE_GAP = {
    "male":  1.00,
    "female": 0.78,
    "other":  0.75,
}

def gaussian_noise(rng, sigma):
    """Gaussian noise with seeded RNG (Box-Muller)"""
    u1 = max(1e-10, rng.next())
    u2 = rng.next()
    return sigma * math.sqrt(-2.0 * math.log(safe_u1(u1))) * math.cos(2.0 * math.pi * u2)

def safe_u1(u1):
    return max(1e-10, u1)

def clamp(val, min_val, max_val):
    return max(min_val, min(max_val, val))

def simulate_credit_outcome(profile, bias_level, rng):
    audit_trail = {}

    # -- Meritocratic baseline (education + income + banking access) --
    base_score = 500.0

    # Income contribution
    income_val = profile.get("annualIncomeINR", 10000.0)
    income_l = math.log10(max(income_val, 10000.0))
    base_score += clamp((income_l - 4.0) * 60.0, -100.0, 150.0)

    # Education contribution
    edu = profile.get("education", "middle")
    edu_bonus = {
        "illiterate": -80.0, "literate_below_primary": -60.0, "primary": -40.0, "middle": -20.0,
        "secondary": 0.0, "higher_secondary": 20.0, "graduate": 60.0, "postgraduate": 80.0,
        "technical_diploma": 40.0, "professional_degree": 90.0,
    }
    base_score += edu_bonus.get(edu, 0.0)

    # Banking access
    assets = profile.get("householdAssets", {})
    if assets.get("bankingService"):
        base_score += 30.0
    if profile.get("hasSmartphone") == "Yes":
        base_score += 10.0
    if profile.get("upiId") and profile.get("upiId") != "None":
        base_score += 15.0

    # Age
    age = profile.get("age", 30)
    if age < 25:
        base_score -= 40.0
    elif age > 65:
        base_score -= 20.0
    elif 30 <= age <= 55:
        base_score += 20.0

    # Urban premium
    if profile.get("areaType") == "urban":
        base_score += 25.0

    # -- Bias layer --
    social_cat = profile.get("socialCategory", "General")
    caste_penalty = CASTE_CREDIT_PENALTY.get(social_cat, 0.0) * bias_level
    
    religion = profile.get("religion", "hindu").lower()
    religion_penalty = RELIGION_CREDIT_PENALTY.get(religion, 0.0) * bias_level

    audit_trail["credit_caste_penalty"] = caste_penalty
    audit_trail["credit_religion_penalty"] = religion_penalty

    # Generate noise
    u1 = max(1e-10, rng.next())
    u2 = rng.next()
    g_noise = 20.0 * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

    final_score = clamp(
        int(round(base_score + caste_penalty + religion_penalty + g_noise)),
        300,
        900
    )

    # -- Loan approval probability --
    if final_score >= 750:
        approval_prob = 0.92
    elif final_score >= 700:
        approval_prob = 0.78
    elif final_score >= 650:
        approval_prob = 0.60
    elif final_score >= 600:
        approval_prob = 0.40
    elif final_score >= 550:
        approval_prob = 0.22
    else:
        approval_prob = 0.08

    # Additional bias on approval decision
    approval_bias_penalty = (
        (0.15 if social_cat in ["SC", "ST"] else 0.0) +
        (0.10 if religion == "muslim" else 0.0)
    ) * bias_level
    approval_prob = clamp(approval_prob - approval_bias_penalty, 0.02, 0.97)
    audit_trail["credit_approval_bias_penalty"] = approval_bias_penalty

    # -- Approved loan amount --
    loan_approved = rng.next() < approval_prob
    approved_amount = None
    if loan_approved:
        expected_mult = 2.0 + rng.next() * 3.0
        approved_amount = clamp(
            int(round(income_val * expected_mult)),
            50000,
            10000000
        )

    reason_codes = []
    if final_score < 600:
        reason_codes.append("LOW_CREDIT_SCORE")
    if income_val < 120000:
        reason_codes.append("INCOME_INSUFFICIENT")
    if not assets.get("bankingService"):
        reason_codes.append("NO_BANK_ACCOUNT")
    if caste_penalty < -40.0:
        reason_codes.append("CASTE_BIAS_APPLIED")

    return {
        "creditScore": final_score,
        "loanApprovalProbability": approval_prob,
        "approvedLoanAmountINR": approved_amount,
        "reasonCodes": reason_codes
    }, audit_trail

def simulate_health_outcome(profile, rng):
    risk_score = 30.0 # baseline

    # Dietary risk
    habits = profile.get("habits", {})
    if habits.get("tobaccoUse", "none") != "none":
        risk_score += 15.0
    if habits.get("alcoholUse") == "heavy":
        risk_score += 12.0
    if habits.get("exerciseFrequency") == "never":
        risk_score += 8.0

    # BMI
    bmi = profile.get("bmi", 22.0)
    if bmi < 18.5:
        bmi_category = "underweight"
        risk_score += 10.0
    elif bmi < 23.0:
        bmi_category = "normal"
    elif bmi < 27.5:
        bmi_category = "overweight"
        risk_score += 8.0
    else:
        bmi_category = "obese"
        risk_score += 18.0

    # Age
    age = profile.get("age", 30)
    if age > 50:
        risk_score += 15.0
    if age > 65:
        risk_score += 10.0

    # SES
    income_val = profile.get("annualIncomeINR", 10000.0)
    if income_val < 60000:
        risk_score += 12.0
    if profile.get("rationCardType") in ["BPL", "AAY"]:
        risk_score += 8.0

    # Disability
    if profile.get("disability", "none") != "none":
        risk_score += 10.0

    # Rural
    if profile.get("areaType") == "rural":
        risk_score += 5.0

    # Noise
    u1 = max(1e-10, rng.next())
    u2 = rng.next()
    g_noise = 5.0 * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

    risk_score = clamp(risk_score + g_noise, 0.0, 100.0)

    # Likely conditions
    conditions = []
    if bmi > 27.5 and age > 35:
        conditions.append("type_2_diabetes_risk")
    if bmi > 27.5 or age > 45:
        conditions.append("hypertension_risk")
    if bmi < 18.5 and profile.get("areaType") == "rural":
        conditions.append("malnutrition")
    if habits.get("tobaccoUse", "none") != "none":
        conditions.append("respiratory_risk")
    if age > 60:
        conditions.append("musculoskeletal_risk")

    # Healthcare access probability
    access_prob = 0.6
    if profile.get("areaType") == "urban":
        access_prob += 0.2
    if profile.get("healthInsurance", "none") != "none":
        access_prob += 0.15
    if income_val > 300000:
        access_prob += 0.1
    access_prob = clamp(access_prob, 0.1, 0.98)

    return {
        "healthRiskScore": int(round(risk_score)),
        "likelyConditions": conditions,
        "healthcareAccessProbability": round(access_prob, 2),
        "bmiCategory": bmi_category
    }

def simulate_education_outcome(profile, bias_level, rng):
    audit_trail = {}

    credential_map = {
        "illiterate": 5.0, "literate_below_primary": 20.0, "primary": 35.0, "middle": 50.0,
        "secondary": 62.0, "higher_secondary": 72.0, "graduate": 82.0, "postgraduate": 90.0,
        "technical_diploma": 75.0, "professional_degree": 88.0,
    }
    edu = profile.get("education", "middle")
    func_lit = credential_map.get(edu, 50.0)

    # Rural deficit
    if profile.get("areaType") == "rural":
        func_lit -= 15.0

    # Income
    income_val = profile.get("annualIncomeINR", 10000.0)
    if income_val < 80000:
        func_lit -= 10.0

    # Government vs private school
    edu_details = profile.get("educationDetails", {})
    if edu_details.get("institutionType") == "government":
        func_lit -= 5.0

    # Bias layer
    social_cat = profile.get("socialCategory", "General")
    education_bias = (
        (8.0 if social_cat == "SC" else 0.0) +
        (12.0 if social_cat == "ST" else 0.0)
    ) * bias_level
    func_lit -= education_bias
    audit_trail["education_quality_bias"] = education_bias

    u1 = max(1e-10, rng.next())
    u2 = rng.next()
    g_noise = 8.0 * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

    func_lit = clamp(int(round(func_lit + g_noise)), 0, 100)

    # Dropout risk
    dropout_risk = 0.05
    age = profile.get("age", 30)
    if age < 18 and profile.get("areaType") == "rural":
        dropout_risk += 0.15
    if profile.get("gender") == "female" and profile.get("areaType") == "rural":
        dropout_risk += 0.12
    if income_val < 60000:
        dropout_risk += 0.10
        
    dropout_bias = (
        (0.15 if social_cat == "ST" else 0.0) +
        (0.08 if social_cat == "SC" else 0.0)
    ) * bias_level
    dropout_risk += dropout_bias
    audit_trail["dropout_bias"] = dropout_bias
    dropout_risk = clamp(dropout_risk, 0.0, 0.95)

    # Educational mobility
    mobility = 0.4
    if income_val > 300000:
        mobility += 0.2
    if profile.get("hasInternetAccess") == "Yes":
        mobility += 0.1
    if profile.get("areaType") == "urban":
        mobility += 0.1
    mobility = clamp(mobility, 0.05, 0.95)

    return {
        "functionalLiteracy": func_lit,
        "dropoutRisk": round(dropout_risk, 2),
        "educationalMobility": round(mobility, 2)
    }, audit_trail

def simulate_employment_outcome(profile, bias_level, rng):
    audit_trail = {}

    # Base wage
    income_val = profile.get("annualIncomeINR", 10000.0)
    expected_wage = income_val / 12.0

    # Wage gap
    edu = profile.get("education", "middle")
    if edu in ["graduate", "postgraduate"]:
        expected_wage *= 1.4
    if profile.get("areaType") == "urban":
        expected_wage *= 1.2

    # Bias layer
    social_cat = profile.get("socialCategory", "General")
    caste_gap_multiplier = 1.0 - (1.0 - CASTE_WAGE_GAP.get(social_cat, 1.0)) * bias_level
    
    gender = profile.get("gender", "male").lower()
    gender_gap_multiplier = 1.0 - (1.0 - GENDER_WAGE_GAP.get(gender, 1.0)) * bias_level

    audit_trail["employment_caste_wage_penalty"] = 1.0 - caste_gap_multiplier
    audit_trail["employment_gender_wage_penalty"] = 1.0 - gender_gap_multiplier

    expected_wage = round(expected_wage * caste_gap_multiplier * gender_gap_multiplier)
    
    u1 = max(1e-10, rng.next())
    u2 = rng.next()
    g_noise = (expected_wage * 0.1) * math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

    expected_wage = clamp(int(round(expected_wage + g_noise)), 3000, 500000)

    # Employment quality
    emp_sec = profile.get("employmentSector", "informal")
    occ = profile.get("occupation", "other_worker")
    age = profile.get("age", 30)

    if emp_sec == "government":
        quality = "formal_high"
    elif emp_sec == "private" and income_val > 400000:
        quality = "formal_mid"
    elif emp_sec == "self_employed" and income_val > 200000:
        quality = "formal_low"
    elif emp_sec == "informal":
        quality = "informal"
    elif occ == "non_worker" and 18 < age < 60:
        quality = "unemployed"
    else:
        quality = "underemployed"

    # Vulnerability index
    vuln = 0.2
    if quality == "informal":
        vuln += 0.3
    if quality == "underemployed":
        vuln += 0.2
    if income_val < 80000:
        vuln += 0.15
        
    vuln_bias = (0.15 if social_cat in ["SC", "ST"] else 0.0) * bias_level
    vuln += vuln_bias
    audit_trail["vulnerability_bias"] = vuln_bias
    vuln = clamp(vuln, 0.0, 0.95)

    return {
        "employmentQuality": quality,
        "expectedMonthlyWageINR": int(round(expected_wage)),
        "wageGapRatio": round(caste_gap_multiplier * gender_gap_multiplier, 3),
        "vulnerabilityIndex": round(vuln, 2)
    }, audit_trail

def simulate_outcomes(profile, bias_level=0.3, rng=None):
    """
    Simulate realistic life outcomes for a demographic profile.
    """
    if rng is None:
        from indian_fakedata.core.sampler import create_rng
        rng = create_rng()
        
    bias = clamp(bias_level, 0.0, 1.0)

    credit, credit_audit = simulate_credit_outcome(profile, bias, rng)
    health = simulate_health_outcome(profile, rng)
    education, edu_audit = simulate_education_outcome(profile, bias, rng)
    employment, emp_audit = simulate_employment_outcome(profile, bias, rng)

    bias_audit = {}
    bias_audit.update(credit_audit)
    bias_audit.update(edu_audit)
    bias_audit.update(emp_audit)

    return {
        "credit": credit,
        "health": health,
        "education": education,
        "employment": employment,
        "_biasAuditTrail": bias_audit
    }
