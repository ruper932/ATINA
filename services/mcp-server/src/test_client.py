import asyncio
from fastmcp import Client
from server import mcp

async def main():
    async with Client(mcp) as client:
        tools = await client.list_tools()
        print("Tools registradas:")
        for tool in tools:
            print("-", tool.name)

        ping_result = await client.call_tool("ping", {})
        print("\nResultado de ping:")
        print(ping_result)

        sensor_result = await client.call_tool("read_mock_sensors", {})
        print("\nResultado de sensores:")
        print(sensor_result)

        estimate_result = await client.call_tool(
            "estimate_fog_collection",
            {
                "humidity_percent": 82.5,
                "temperature_c": 9.0
            }
        )
        print("\nResultado de estimación:")
        print(estimate_result)

if __name__ == "__main__":
    asyncio.run(main())