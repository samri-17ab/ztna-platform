package ztna.access

import data.policies

# Default deny all access
default action = "DENY"
default reason = "No matching policy found or implicit deny"

# -----------------------------------------------------------------------------
# Evaluated Result
# The Go API queries this object: {"input": {...}} -> {"result": {"action": "...", "reason": "..."}}
# -----------------------------------------------------------------------------
result = {
	"action": action,
	"reason": reason
}

# -----------------------------------------------------------------------------
# Scenario 1: Device is completely untrusted / high risk
# -----------------------------------------------------------------------------
action = "RESTRICT_VLAN_99" {
	input.device.risk >= 80
}

reason = "Device posture is severely non-compliant (Risk >= 80). Forcing to Quarantine VLAN." {
	input.device.risk >= 80
}

# -----------------------------------------------------------------------------
# Scenario 2: Allowed Access (Corporate VLAN)
# -----------------------------------------------------------------------------
# Engineers / Admins get full access if risk is low
action = "ALLOW_VLAN_10" {
	input.device.risk < 50
	is_engineering_role
}

reason = "Authorized Engineering/Admin device with compliant posture" {
	input.device.risk < 50
	is_engineering_role
}

# -----------------------------------------------------------------------------
# Scenario 3: Guest / Standard User Access
# -----------------------------------------------------------------------------
action = "ALLOW_VLAN_50" {
	input.device.risk < 80
	input.user.role == "Guest"
}

reason = "Guest access granted (VLAN 50)" {
	input.device.risk < 80
	input.user.role == "Guest"
}

# -----------------------------------------------------------------------------
# Scenario 4: RBAC Department Access (HR Network)
# -----------------------------------------------------------------------------
action = "ALLOW_VLAN_20" {
	input.device.risk < 50
	input.user.department == "HR"
}

reason = "Authorized HR User with compliant posture" {
	input.device.risk < 50
	input.user.department == "HR"
}

# -----------------------------------------------------------------------------
# Scenario 5: Contextual Block (Time-Based)
# -----------------------------------------------------------------------------
action = "DENY" {
	input.user.role == "Contractor"
	is_outside_business_hours
}

reason = "Contractors are not permitted access outside of business hours (9AM-5PM)" {
	input.user.role == "Contractor"
	is_outside_business_hours
}

# -----------------------------------------------------------------------------
# Helper Rules
# -----------------------------------------------------------------------------
is_engineering_role {
	input.user.role == "Dev"
}

is_engineering_role {
	input.user.role == "Admin"
}

is_engineering_role {
	input.user.role == "SecOps"
}

is_outside_business_hours {
	input.context.time_of_day < 9
}

is_outside_business_hours {
	input.context.time_of_day >= 17
}
