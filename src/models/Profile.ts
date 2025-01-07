import { IProfile } from "../interfaces/IProfile";

export class Profile implements IProfile {
  constructor(
    public firstName: string,
    public lastName: string,
    public dob: Date,
    public location: string,
    public profilePicture: string,
    public interests: string[],
    public sex: "male" | "female" | "other",
    public email: string,
    public passcode: number
  ) {
    this.validateInterests();
    this.validateAge();
    this.validateEmail();
    this.validateSex();
  }

  private validateInterests(): void {
    if (!this.interests || this.interests.length === 0) {
      throw new Error("Interests are required");
    }
    if (this.interests.length > 5) {
      throw new Error("Maximum 5 interests allowed");
    }
  }

  private validateEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format");
    }
  }

  private validateSex(): void {
    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(this.sex.toLowerCase())) {
      throw new Error("Allowed genders should are male | female | other");
    }
  }

  private validateAge(): void {
    if (!this.isAgeValid()) {
      throw new Error("User must be 18 or older");
    }
  }

  private getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  private isAgeValid(): boolean {
    return this.getAge() >= 18;
  }

  toJSON() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      dob: this.dob,
      location: this.location,
      profilePicture: this.profilePicture,
      interests: this.interests,
      sex: this.sex,
      email: this.email,
    };
  }
}
