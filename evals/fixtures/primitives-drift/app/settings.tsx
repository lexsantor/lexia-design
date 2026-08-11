// Fixture app screen: bypasses the primitives and drifts widths and colors.
// Expected: native-control-in-app-layer, hand-rolled-table,
// container-width-drift, raw-black-white.
import { Button } from "../components/ui/button";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl">
      <section className="mx-auto max-w-3xl bg-white text-black">
        <h1>Settings</h1>
        <label htmlFor="tz">Timezone</label>
        <select id="tz">
          <option>Europe/Madrid</option>
        </select>
        <label htmlFor="name">Display name</label>
        <input id="name" type="text" />
      </section>
      <section className="mx-auto max-w-[68rem]">
        <table>
          <thead>
            <tr><th>Key</th><th>Value</th></tr>
          </thead>
          <tbody>
            <tr><td>Plan</td><td>Pro</td></tr>
          </tbody>
        </table>
        <Button>Save changes</Button>
      </section>
    </main>
  );
}
