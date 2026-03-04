// Test file to verify MosaicReveal import works
import MosaicReveal from './loading-screens/MosaicReveal';

export default function TestImport() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl text-[#00ff00] mb-4">Test Import Page</h1>
      <p>If you can see this, the import works!</p>
      <p className="mt-4">MosaicReveal type: {typeof MosaicReveal}</p>
    </div>
  );
}
