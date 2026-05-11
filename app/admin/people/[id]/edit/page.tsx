import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { updatePerson } from "@/lib/actions";
import EditPersonForm from "./EditPersonForm";
import { resolveCountryName } from "@/lib/countries";

function splitDate(date?: string | null) {
  if (!date) return { day: "", month: "", year: "" };
  const [year, month, day] = date.split("-");
  return { day: day || "", month: month || "", year: year || "" };
}

export default async function EditPersonPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const personId = Number.parseInt(params.id, 10);
  if (!Number.isFinite(personId)) notFound();

  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) notFound();

  const dob = splitDate(person.dob);
  const dod = splitDate(person.dateOfDeath);

  return (
    <EditPersonForm
      action={updatePerson}
      person={{
        id: person.id,
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        matchName: person.matchName || "",
        commonName: person.commonName || "",
        status: person.status || "active",
        placeOfBirth: person.placeOfBirth || "",
        countryOfBirth: resolveCountryName(person.countryOfBirth),
        nationality: resolveCountryName(person.nationality),
        gender: person.gender || "male",
        position: person.position || "",
        isReferee: person.isReferee || "no",
        strongFoot: person.strongFoot || "",
        height: person.height || "",
        weight: person.weight || "",
        nickname: person.nickname || "",
        birthYear: person.birthYear || "",
        mappingSource: person.mappingSource || "",
        dobDay: dob.day,
        dobMonth: dob.month,
        dobYear: dob.year,
        dodDay: dod.day,
        dodMonth: dod.month,
        dodYear: dod.year,
      }}
    />
  );
}
