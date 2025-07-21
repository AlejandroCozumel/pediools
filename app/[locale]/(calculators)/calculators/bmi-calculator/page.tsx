export const runtime = 'edge';
import { BMIForm } from "./BMIForm";

export default function BMIPage() {
  return (
    <div className="container mx-auto">
      <BMIForm />
    </div>
  );
}