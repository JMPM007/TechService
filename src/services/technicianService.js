const API_URL = "http://localhost:3000/api/tecnicos";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay una sesión activa. Por favor, inicia sesión nuevamente.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
};

export const registerTechnician = async (technicianData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(technicianData)
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.clear();
    throw new Error("Sesión expirada o no autorizada. Por favor inicia sesión como ADMIN.");
  }

  if (!response.ok) {
    throw new Error(data.error || data.mensaje || "Error al registrar técnico");
  }

  return data;
};

export const updateTechnicianStatusService = async (tecnicoId, nuevoEstado, token) => {
  const response = await fetch(`${API_URL}/${tecnicoId}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ estado: nuevoEstado })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al actualizar el estado del técnico");
  }

  return data;
};

export const getTechniciansService = async (token) => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener la lista de técnicos");
  }

  return data;
};

