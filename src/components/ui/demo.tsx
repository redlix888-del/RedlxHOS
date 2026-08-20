import { Home } from "@/components/blocks/chat-template";
import { SidebarProvider } from "@/components/blocks/sidebar";

function Demo() {
  return (
    <SidebarProvider>
      <Home />
    </SidebarProvider>
  );
}

export { Demo };
