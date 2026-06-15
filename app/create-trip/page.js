import { redirect } from "next/navigation";

export default function CreateTripRedirect() {
  const uuid = crypto.randomUUID();
  redirect(`/create-trip/${uuid}`);
}
