import { Panel } from "@/components/ui/panel";

// Base page of the client site. The request form itself is built in Milestone 3.
export default function HomePage() {
  return (
    <Panel variant="large" className="mx-auto max-w-[880px] px-6 py-10 text-center sm:px-12">
      <h1 className="text-h2 font-medium sm:text-h1">מצאו את הנכס שמתאים לכם</h1>
      <p className="mt-2 text-body text-slate-text">מלאו כמה פרטים ונציג לכם עד 3 נכסים מתאימים</p>
    </Panel>
  );
}
