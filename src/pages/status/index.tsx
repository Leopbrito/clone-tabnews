import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <DatabaseInfo />
    </>
  );
}

function UpdatedAt() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  return (
    <>
      <div>
        Ultima atualização:{" "}
        {isLoading
          ? "Carregando"
          : new Date(data.updated_at).toLocaleString("pt-BR")}
      </div>
    </>
  );
}

function DatabaseInfo() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });
  const database = data?.dependencies?.database;
  return (
    <>
      <h2>Database</h2>
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          <p>Versão: {database?.version?.toString()}</p>
          <p>Número maximo de conexões: {database.max_connections}</p>
          <p>Conexões abertas: {database.opened_connections}</p>
        </div>
      )}
    </>
  );
}
