import { createContext, useContext, useState } from "react";
import { initialServices, initialQueues } from "../data/mockData";

// context
const ServiceContext = createContext(null);

// cleans up fields before saving
const cleanFields = (fields) => {
  const cleaned = { ...fields };
  if (typeof cleaned.name === "string") cleaned.name = cleaned.name.trim();
  if (typeof cleaned.description === "string") cleaned.description = cleaned.description.trim();
  if (cleaned.durationMinutes !== undefined) cleaned.durationMinutes = Number(cleaned.durationMinutes);
  return cleaned;
};

export function ServiceProvider({ children }) {
  // the services list and the queues
  const [services, setServices] = useState(initialServices);
  const [queues] = useState(initialQueues);

  // find one service
  const getServiceById = (id) => {
    return services.find((s) => s.id === Number(id));
  };

  const addService = ({ name, description, durationMinutes, priority }) => {
    // new id is biggest id + 1
    const nextId = Math.max(0, ...services.map((s) => s.id)) + 1;

    const newService = {
      id: nextId,
      ...cleanFields({ name, description, durationMinutes }),
      priority,
      // new services start open
      isOpen: true,
    };

    setServices((prev) => [...prev, newService]);
    return newService;
  };

  // replace only the fields that were passed in
  const updateService = (id, fields) => {
    const cleaned = cleanFields(fields);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...cleaned } : s)));
  };

  // flip services between open and closed
  const toggleServiceOpen = (id) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isOpen: !s.isOpen } : s)));
  };

  // people still in line
  const getQueueLength = (serviceId) => {
    return (queues[serviceId] || []).filter((p) => p.status !== "served").length;
  };

  const value = {
    services,
    queues,
    getServiceById,
    addService,
    updateService,
    toggleServiceOpen,
    getQueueLength,
  };

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

// hook
export function useServices() {
  const context = useContext(ServiceContext);

  // if null the component isn't inside <ServiceProvider>
  if (context === null) {
    throw new Error("useServices must be used inside a <ServiceProvider>");
  }

  return context;
}