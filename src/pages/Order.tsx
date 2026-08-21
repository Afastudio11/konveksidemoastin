import Header from "@/components/Header";
import CustomerOrderForm from "@/components/CustomerOrderForm";

export default function Order() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      <Header />
      <div className="pt-24">
        <CustomerOrderForm />
      </div>
    </div>
  );
}
