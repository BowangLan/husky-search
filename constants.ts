
const ValidEmailDomains = [
  "u.washington.edu",
  "uw.edu",
  "cs.washington.edu",
]

export const isEmailFromUW = async (email: string) => {
  return ValidEmailDomains.some(domain => email.endsWith(domain));
}
