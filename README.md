# ShardDB

[![C++17](https://img.shields.io/badge/C%2B%2B-17-blue.svg)](https://en.wikipedia.org/wiki/C%2B%2B17)
[![Platform](https://img.shields.io/badge/platform-Windows%2011%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)]()
[![Tests](https://img.shields.io/badge/tests-22%20passed%20%2F%200%20failed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**ShardDB** is a complete, runnable, well-tested mini distributed key-value database built from scratch in modern C++17. It features append-only Write-Ahead Logging (WAL) for durability, consistent hashing with virtual nodes for partitioning, primary-to-replica replication with configurable acknowledgement policies, periodic health monitoring, and a versioned TCP binary wire protocol.

---

## Architecture

```
                    +--------------------+
                    |    ShardDB CLI     |
                    +---------+----------+
                              | TCP (SHDB Protocol)
                              v
                    +--------------------+
                    |    Coordinator     |
                    |  - ShardManager    |
                    |  - HealthMonitor   |
                    +----+-----+----+----+
                         |     |    |
        +----------------+     |    +----------------+
        | TCP                  | TCP                 | TCP
        v                      v                     v
+---------------+      +---------------+      +---------------+
| Storage Node1 |<====>| Storage Node2 |<====>| Storage Node3 |
|  - Engine     |      |  - Engine     |      |  - Engine     |
|  - WAL Log    |      |  - WAL Log    |      |  - WAL Log    |
|  - Replicator |      |  - Replicator |      |  - Replicator |
+---------------+      +---------------+      +---------------+
```

---

## Key Features

- **Storage Engine & WAL**: Append-only Write-Ahead Log with IEEE 802.3 CRC32 checksums, in-memory hash table index, and explicit physical disk flush (`_commit` / `FlushFileBuffers` on Windows, `fsync` on POSIX).
- **Crash Recovery**: Safe replay on restart. Trailing incomplete records caused by abrupt power loss are automatically detected and truncated back to the last valid record boundary. Middle corruption is detected and safely reported.
- **Consistent Hashing**: 64-bit MurmurHash3 consistent hashing ring with configurable virtual nodes (default: 100 virtual tokens per node). Deterministic routing and preference lists for replication.
- **Primary-to-Replica Replication**: Configurable replication factor and write acknowledgement policies (`primary_only`, `all`, `quorum`). Replicas persist operations to their local WAL and support idempotent deduplication.
- **Binary Wire Protocol (`SHDB`)**: Fixed 26-byte header with magic bytes (`0x53484442`), versioning, opcodes, request IDs, CRC32 header integrity check, and strict pre-allocation frame size limits.
- **Health Monitoring**: Asynchronous background health check thread polling nodes via `PING`/`PONG`. Unhealthy nodes are flagged immediately, returning explicit `NODE_UNAVAILABLE` errors.
- **Zero External Dependencies**: Built entirely using C++17 standard libraries, Winsock2/POSIX sockets, and a built-in test framework.

---

## Project Structure

```
DAY4/
  CMakeLists.txt                # Build definition
  CMakePresets.json             # VS Code & Ninja build presets
  README.md                     # Project documentation
  LICENSE                       # MIT License
  .gitignore                    # Git ignore file
  config/
    cluster.example.json        # 3-node + coordinator cluster configuration
  docs/
    ARCHITECTURE.md             # Detailed architectural overview
    PROTOCOL.md                 # 26-byte binary wire protocol specification
    STORAGE_ENGINE.md           # WAL layout, durability & recovery details
    CONSISTENCY.md              # Consistency model, ack policies & limits
    WINDOWS_SETUP.md            # Windows 11 step-by-step developer guide
    TROUBLESHOOTING.md          # Port conflicts, node failures & diagnostics
  include/
    sharddb/
      common/                   # Types, CRC32, Status, Logger
      config/                   # Cluster JSON configuration parser
      network/                  # Portable Socket & TcpListener abstraction
      protocol/                 # Message framing & serializer
      storage/                  # WAL & StorageEngine
      sharding/                 # ConsistentHashRing & ShardManager
      replication/              # ReplicationManager
      coordinator/              # HealthMonitor & Coordinator
      node/                     # StorageNode
      client/                   # Client library
  src/                          # Component implementations
  tests/
    unit/                       # CRC, WAL, Engine, Ring, Protocol, Config tests
    integration/                # End-to-end cluster sharding & failover tests
    test_runner.cpp             # Test executable entry point
  benchmarks/
    benchmark_main.cpp          # Throughput and latency benchmark
  scripts/
    start_cluster.ps1           # Launches 3 storage nodes and coordinator
    stop_cluster.ps1            # Cleanly stops cluster processes
    run_tests.ps1               # Builds and runs test suite
```

---

## Quick Start on Windows 11

### 1. Build the Project
Open PowerShell in the project directory:
```powershell
$env:PATH = "C:\msys64\ucrt64\bin;" + $env:PATH
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### 2. Run the Automated Test Suite
```powershell
.\build\sharddb-tests.exe
```
Output:
```
=======================================================
               Running ShardDB Test Suite              
=======================================================
[ RUN      ] ClusterIntegrationTest.EndToEndShardingAndReplication
[       OK ] ClusterIntegrationTest.EndToEndShardingAndReplication
...
-------------------------------------------------------
 Test Results: 22 passed, 0 failed, 22 total
=======================================================
```

### 3. Start the Local 3-Node Cluster
```powershell
.\scripts\start_cluster.ps1
```

### 4. Connect with the CLI
```powershell
.\build\sharddb-cli.exe
```

Interactive example:
```text
sharddb> SET username "shubh"
OK

sharddb> GET username
"shubh"

sharddb> EXISTS username
(integer) 1

sharddb> SET city "San Francisco"
OK

sharddb> KEYS
1) "city"
2) "username"

sharddb> NODES
{ ... cluster topology and health info ... }

sharddb> STATUS
{ ... request metrics and coordinator uptime ... }

sharddb> DELETE city
(integer) 1

sharddb> GET city
(nil)

sharddb> EXIT
```

### 5. Run the Benchmark
```powershell
.\build\sharddb-bench.exe --requests 1000 --threads 4 --val-size 128
```

### 6. Stop the Cluster Cleanly
```powershell
.\scripts\stop_cluster.ps1
```

---

## CLI Command Reference

| Command | Arguments | Description |
|---|---|---|
| `SET` | `<key> <value> [policy]` | Store key-value pair. Policy: `primary_only`, `all`, `quorum` |
| `GET` | `<key>` | Retrieve value by key (returns `(nil)` if not found) |
| `EXISTS` | `<key>` | Returns 1 if key exists, 0 otherwise |
| `DELETE` | `<key> [policy]` | Delete key. Policy: `primary_only`, `all`, `quorum` |
| `KEYS` | `[limit] [prefix]` | List keys with optional limit and prefix |
| `STATUS` | None | Show coordinator metrics and request counters |
| `NODES` | None | Show cluster nodes, virtual token counts, and health states |
| `INFO` | None | Display cluster configuration and runtime info |
| `HELP` | None | Display command help |
| `EXIT` | None | Exit the CLI session |

---

## Known Limitations & Roadmap

- **Replication**: v1 uses primary-to-replica replication. Automatic leader election (via Raft or Paxos) is scheduled for v2.
- **Failover**: When a primary node fails, requests return `NODE_UNAVAILABLE` rather than auto-promoting to avoid split-brain.
- **Compaction**: WAL log compaction and SSTable/LSM-tree tiered storage are planned for future versions.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# ShardDB
