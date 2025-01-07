import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

interface ValidationRule {
  type: "string" | "number" | "array" | "date";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

interface ProfileRules {
  [key: string]: ValidationRule;
}

const isValidBase64Image = (base64String: string): boolean => {
  try {
    // Simple regex to validate base64 image format
    const base64Regex =
      /^data:image\/(jpeg|jpg|png|gif);base64,[A-Za-z0-9+/=]+$/;
    return base64Regex.test(base64String);
  } catch (error) {
    return false;
  }
};

const validateImageSize = (base64Str: string): boolean => {
  const base64 = base64Str.split(",")[1];
  const sizeInBytes = Buffer.from(base64, "base64").length;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= 5;
};

const isValidDateFormat = (dateString: string): boolean => {
  const dateFormatRegex: RegExp = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateFormatRegex.test(dateString)) {
    return false;
  }

  const date: Date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  const [year, month, day]: number[] = dateString.split("-").map(Number);
  const monthDays: number = new Date(year, month, 0).getDate();

  return month >= 1 && month <= 12 && day >= 1 && day <= monthDays;
};

const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const profileValidationRules: ProfileRules = {
  firstName: { type: "string", required: true, minLength: 2, maxLength: 50 },
  lastName: { type: "string", required: true, minLength: 2, maxLength: 50 },
  dob: { type: "date", required: true },
  location: { type: "string", required: true, minLength: 2, maxLength: 100 },
  interests: { type: "array", required: true },
  sex: { type: "string", required: true },
  email: { type: "string", required: true, minLength: 5, maxLength: 100 },
  passcode: { type: "number", required: true },
  profilePicture: { type: "string", required: true },
};

const calculateAge = (birthDate: Date): number => {
  const today: Date = new Date();
  let age: number = today.getFullYear() - birthDate.getFullYear();
  const monthDiff: number = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const validateProfileData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validationErrors: string[] = [];

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({
        success: false,
        message: "Request body is empty",
        errors: ["Request body is empty"],
      });
      return;
    }

    // Profile picture validation
    if (!req.body.profilePicture) {
      validationErrors.push("Profile picture is empty");
    } else if (!isValidBase64Image(req.body.profilePicture)) {
      validationErrors.push(
        "Profile picture must be a valid base64 image (JPEG, PNG, or GIF)"
      );
    } else if (!validateImageSize(req.body.profilePicture)) {
      validationErrors.push("Profile picture must be less than 5MB");
    }

    Object.entries(profileValidationRules).forEach(([field, rules]) => {
      const value = req.body[field];

      if (rules.required) {
        if (!value) {
          validationErrors.push(`${field} is empty`);
          return;
        }
        if (isEmpty(value)) {
          validationErrors.push(`${field} is empty`);
          return;
        }
      }

      if (value) {
        switch (rules.type) {
          case "string":
            if (typeof value !== "string") {
              validationErrors.push(`${field} must be a string`);
            } else {
              if (rules.minLength && value.trim().length < rules.minLength) {
                validationErrors.push(
                  `${field} must be at least ${rules.minLength} characters`
                );
              }
              if (rules.maxLength && value.trim().length > rules.maxLength) {
                validationErrors.push(
                  `${field} must be no more than ${rules.maxLength} characters`
                );
              }
              if (field === "sex") {
                const allowedGenders: string[] = ["male", "female", "other"];
                if (!allowedGenders.includes(value.toLowerCase())) {
                  validationErrors.push(
                    "Allowed genders are male | female | other"
                  );
                }
              }
              if (field === "email") {
                const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                  validationErrors.push("Invalid email format");
                }
              }
            }
            break;

          case "array":
            if (!Array.isArray(value)) {
              validationErrors.push(`${field} must be an array`);
            } else if (field === "interests") {
              if (value.length === 0) {
                validationErrors.push("At least one interest is required");
              } else if (value.length > 5) {
                validationErrors.push("Maximum 5 interests allowed");
              }
              value.forEach((interest: string, index: number) => {
                if (isEmpty(interest)) {
                  validationErrors.push(
                    `Interest at position ${index + 1} is empty`
                  );
                }
              });
            }
            break;

          case "date":
            if (field === "dob") {
              if (!isValidDateFormat(value)) {
                validationErrors.push(
                  "Date of birth must be in YYYY-MM-DD format"
                );
              } else {
                const date: Date = new Date(value);
                const age: number = calculateAge(date);
                if (age < 18) {
                  validationErrors.push("User must be 18 or older");
                }
                if (date > new Date()) {
                  validationErrors.push(
                    "Date of birth cannot be in the future"
                  );
                }
              }
            }
            break;

          case "number":
            if (field === "passcode") {
              const passcodeNum: number = Number(value);
              if (isNaN(passcodeNum)) {
                validationErrors.push("Passcode must be a number");
              } else {
                const passcodeStr: string = passcodeNum.toString();
                if (passcodeStr.length !== 6) {
                  validationErrors.push("Passcode must be a 6-digit number");
                }
              }
            }
            break;
        }
      }
    });

    if (validationErrors.length > 0) {
      logger.error("Validation errors:", validationErrors);
      res.status(400).json({
        success: false,
        message: validationErrors.join(", "),
        errors: validationErrors,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Validation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during validation",
    });
  }
};

export const validateLoginData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({
      success: false,
      message: "Request body is empty",
      errors: ["Request body is empty"],
    });
    return;
  }

  const { email, passcode } = req.body;
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is empty");
  } else if (typeof email !== "string") {
    errors.push("Email must be a string");
  } else if (isEmpty(email)) {
    errors.push("Email is empty");
  } else {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  if (!passcode) {
    errors.push("Passcode is empty");
  } else {
    const passcodeNum: number = Number(passcode);
    if (isNaN(passcodeNum)) {
      errors.push("Passcode must be a number");
    } else {
      const passcodeStr: string = passcodeNum.toString();
      if (passcodeStr.length !== 6) {
        errors.push("Passcode must be a 6-digit number");
      }
    }
  }

  if (errors.length > 0) {
    logger.error("Login validation errors:", errors);
    res.status(400).json({
      success: false,
      message: errors.join(", "),
      errors,
    });
    return;
  }

  next();
};
