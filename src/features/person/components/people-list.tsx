import { Link } from "react-router-dom";

import { Person } from "../../person";

interface PeopleListProps {
  people: Person[]
}

export const PeopleList = ({ people }: PeopleListProps) => {
  const personInfo = (person: Person) => {
    let retval = " (";
    if (person.dob === null && person.dod === null && person.nationality === null) {
      return ". ";
    }
    if (person.nationality !== null) {
      retval += person.nationality.name;
    }
    if (person.dob !== null || person.dod !== null) {
      if (person.dob !== null) {
        retval += ", " + person.dob;
      }
      retval += " - "
      if (person.dod !== null) {
        retval += person.dod;
      }
    }
    retval += "). ";
    return retval;
  }

  return (
    <>
      {people.map((person) => (
        <div key={person.id}>
          <Link to={`/people/${person.id}`}>{person.alt_name}</Link>
          <></>{personInfo(person)}
          <> </>{person.roles && person.roles.map(role => role).join(", ")}
          {person.roles.length > 0 && <>.</>}
        </div>
      ))}
    </>
  )
}