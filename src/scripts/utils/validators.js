export const validators = {
  required(value, fieldName = "This field") {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }
    return null;
  },

  email(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  },

  minLength(value, length, fieldName = "This field") {
    if (value.length < length) {
      return `${fieldName} must be at least ${length} characters`;
    }
    return null;
  },

  maxLength(value, length, fieldName = "This field") {
    if (value.length > length) {
      return `${fieldName} must not exceed ${length} characters`;
    }
    return null;
  },

  match(value, compareValue, fieldName = "This field") {
    if (value !== compareValue) {
      return `${fieldName} do not match`;
    }
    return null;
  },
};

export function validateForm(fields) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(fields)) {
    for (const rule of rules) {
      const error = rule();
      if (error) {
        errors[fieldName] = error;
        isValid = false;
        break;
      }
    }
  }

  return { isValid, errors };
}
