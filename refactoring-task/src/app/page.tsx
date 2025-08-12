import Table, { Issue } from "./components/table";
import rawIssues from "./constants/issues.json";

export default function Home() {
  // Make sure the data from the JSON file matches the Issue type.
  // This helps keep the data safe and prevents errors if the data shape changes.
  const issues: Issue[] = (rawIssues as unknown as Issue[]).map((i) => ({
    id: i.id,
    type: i.type,
    errorMessage: i.errorMessage,
    status: i.status,
    numEvents: i.numEvents,
    numUsers: i.numUsers,
    impactScore: i.impactScore,
  }));

  return <Table issues={issues} />;
}
