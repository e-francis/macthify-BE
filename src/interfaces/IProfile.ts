export interface IProfile {
  firstName: string;
  lastName: string;
  dob: Date;
  location: string;
  profilePicture: string;
  interests: string[];
  sex: "male" | "female" | "other";
  email: string;
  passcode: number;
}
