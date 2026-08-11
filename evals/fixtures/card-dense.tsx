// Fixture: very high density of card-like enclosures (slop/card-density).
// Fourteen rounded+border blocks in one component: cards inside cards.
export function Overview() {
  return (
    <div className="rounded-xl border p-6">
      <div className="rounded-lg border p-4">A</div>
      <div className="rounded-lg border p-4">B</div>
      <div className="rounded-lg border p-4">C</div>
      <div className="rounded-lg border p-4">D</div>
      <div className="rounded-lg border p-4">E</div>
      <div className="rounded-lg border p-4">F</div>
      <div className="rounded-lg border p-4">G</div>
      <div className="rounded-lg border p-4">H</div>
      <div className="rounded-lg border p-4">I</div>
      <div className="rounded-lg border p-4">J</div>
      <div className="rounded-lg border p-4">K</div>
      <div className="rounded-lg border p-4">L</div>
      <div className="rounded-lg border p-4">M</div>
    </div>
  );
}
