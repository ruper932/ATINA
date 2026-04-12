from fastmcp import FastMCP
from datetime import datetime
import random
import sys

mcp = FastMCP("ATINA MCP Server")

@mcp.tool
def ping() -> dict:
    """Verifica que el servidor MCP está funcionando."""
    return {
        "status": "ok",
        "server": "ATINA MCP Server",
        "timestamp": datetime.now().isoformat()
    }

@mcp.tool
def read_mock_sensors() -> dict:
    """Devuelve lecturas simuladas de sensores."""
    return {
        "temperature_c": round(random.uniform(4, 18), 2),
        "humidity_percent": round(random.uniform(60, 95), 2),
        "pressure_hpa": round(random.uniform(850, 890), 2),
        "flow_l_min": round(random.uniform(0.1, 1.5), 2)
    }

@mcp.tool
def estimate_fog_collection(humidity_percent: float, temperature_c: float) -> dict:
    """Estimación inicial simple de captación diaria."""
    estimate = max(0, round((humidity_percent * 0.18) - (temperature_c * 0.35), 2))
    return {
        "estimated_liters_day": estimate,
        "model": "prototype-v0"
    }

if __name__ == "__main__":
    print("Iniciando servidor MCP ATINA...", file=sys.stderr)
    mcp.run()