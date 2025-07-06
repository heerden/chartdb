import type { Diagram } from '../../domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DBTable } from '@/lib/domain/db-table';
import type { DataType } from '../data-types/data-types';
// import { generateCacheKey, getFromCache, setInCache } from './export-sql-cache';
import { exportMSSQL } from './export-per-type/mssql';
import { exportPostgreSQL } from './export-per-type/postgresql';
import { exportSQLite } from './export-per-type/sqlite';
import { exportMySQL } from './export-per-type/mysql';

// Function to simplify verbose data type names
const simplifyDataType = (typeName: string): string => {
    const typeMap: Record<string, string> = {
        'character varying': 'varchar',
        'char varying': 'varchar',
        integer: 'int',
        int4: 'int',
        int8: 'bigint',
        serial4: 'serial',
        serial8: 'bigserial',
        float8: 'double precision',
        float4: 'real',
        bool: 'boolean',
        character: 'char',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'time without time zone': 'time',
        'time with time zone': 'timetz',
    };

    return typeMap[typeName.toLowerCase()] || typeName;
};

export const exportBaseSQL = ({
    diagram,
    targetDatabaseType,
    isDBMLFlow = false,
}: {
    diagram: Diagram;
    targetDatabaseType: DatabaseType;
    isDBMLFlow?: boolean;
}): string => {
    const { tables, relationships } = diagram;

    if (!tables || tables.length === 0) {
        return '';
    }

    if (!isDBMLFlow && diagram.databaseType === targetDatabaseType) {
        switch (diagram.databaseType) {
            case DatabaseType.SQL_SERVER:
                return exportMSSQL(diagram);
            case DatabaseType.POSTGRESQL:
                return exportPostgreSQL(diagram);
            case DatabaseType.SQLITE:
                return exportSQLite(diagram);
            case DatabaseType.MYSQL:
            case DatabaseType.MARIADB:
                return exportMySQL(diagram);
            default:
                return exportPostgreSQL(diagram);
        }
    }

    // Filter out the tables that are views
    const nonViewTables = tables.filter((table) => !table.isView);

    // Align the data types based on foreign key relationships
    alignForeignKeyDataTypes(diagram);

    // Initialize the SQL script string
    let sqlScript = '';

    // First create the CREATE SCHEMA statements for all the found schemas based on tables
    const schemas = new Set<string>();
    tables.forEach((table) => {
        if (table.schema) {
            schemas.add(table.schema);
        }
    });

    // Add CREATE SCHEMA statements if any schemas exist
    schemas.forEach((schema) => {
        sqlScript += `CREATE SCHEMA IF NOT EXISTS ${schema};\n`;
    });
    if (schemas.size > 0) sqlScript += '\n'; // Add newline only if schemas were added

    // Add CREATE TYPE statements for ENUMs and COMPOSITE types from diagram.customTypes
    if (diagram.customTypes && diagram.customTypes.length > 0) {
        diagram.customTypes.forEach((customType) => {
            const typeNameWithSchema = customType.schema
                ? `${customType.schema}.${customType.name}`
                : customType.name;

            if (
                customType.kind === 'enum' &&
                customType.values &&
                customType.values.length > 0
            ) {
                // For PostgreSQL, generate CREATE TYPE ... AS ENUM
                // For other DBs, this might need adjustment or be omitted if not supported directly
                // or if we rely on the DBML generator to create Enums separately (as currently done)
                // For now, let's assume PostgreSQL-style for demonstration if isDBMLFlow is false.
                // If isDBMLFlow is true, we let TableDBML.tsx handle Enum syntax directly.
                if (
                    targetDatabaseType === DatabaseType.POSTGRESQL &&
                    !isDBMLFlow
                ) {
                    const enumValues = customType.values
                        .map((v) => `'${v.replace(/'/g, "''")}'`)
                        .join(', ');
                    sqlScript += `CREATE TYPE ${typeNameWithSchema} AS ENUM (${enumValues});\n`;
                }
            } else if (
                customType.kind === 'composite' &&
                customType.fields &&
                customType.fields.length > 0
            ) {
                // For PostgreSQL, generate CREATE TYPE ... AS (...)
                // This is crucial for composite types to be recognized by the DBML importer
                if (
                    targetDatabaseType === DatabaseType.POSTGRESQL ||
                    isDBMLFlow
                ) {
                    // Assume other DBs might not support this or DBML flow needs it
                    const compositeFields = customType.fields
                        .map((f) => `${f.field} ${simplifyDataType(f.type)}`)
                        .join(',\n    ');
                    sqlScript += `CREATE TYPE ${typeNameWithSchema} AS (\n    ${compositeFields}\n);\n`;
                }
            }
        });
        sqlScript += '\n'; // Add a newline if custom types were processed
    }

    // Add CREATE SEQUENCE statements
    const sequences = new Set<string>();

    tables.forEach((table) => {
        table.fields.forEach((field) => {
            if (field.default) {
                // Match nextval('schema.sequence_name') or nextval('sequence_name')
                const match = field.default.match(
                    /nextval\('([^']+)'(?:::[^)]+)?\)/
                );
                if (match) {
                    sequences.add(match[1]);
                }
            }
        });
    });

    sequences.forEach((sequence) => {
        sqlScript += `CREATE SEQUENCE IF NOT EXISTS ${sequence};\n`;
    });
    sqlScript += '\n';

    // Loop through each non-view table to generate the SQL statements
    nonViewTables.forEach((table) => {
        const tableName = table.schema
            ? `${table.schema}.${table.name}`
            : table.name;
        sqlScript += `CREATE TABLE ${tableName} (\n`;

        table.fields.forEach((field, index) => {
            let typeName = simplifyDataType(field.type.name);

            // Handle ENUM type
            // If we are generating SQL for DBML flow, and we ALREADY generated CREATE TYPE for enums (e.g., for PG),
            // then we should use the enum type name. Otherwise, map to text.
            // However, the current TableDBML.tsx generates its own Enum blocks, so for DBML flow,
            // converting to TEXT here might still be the safest bet to avoid conflicts if SQL enums aren't perfectly parsed.
            // Let's adjust: if it's a known custom enum type, use its name for PG, otherwise TEXT.
            const customEnumType = diagram.customTypes?.find(
                (ct) =>
                    ct.name === field.type.name &&
                    ct.kind === 'enum' &&
                    (ct.schema ? ct.schema === table.schema : true)
            );

            if (
                customEnumType &&
                targetDatabaseType === DatabaseType.POSTGRESQL &&
                !isDBMLFlow
            ) {
                typeName = customEnumType.schema
                    ? `${customEnumType.schema}.${customEnumType.name}`
                    : customEnumType.name;
            } else if (typeName.toLowerCase() === 'enum') {
                // Fallback for non-PG or if custom type not found, or for DBML flow if not handled by CREATE TYPE above
                typeName = 'text';
            }

            // Check if the field type is a known composite custom type
            const customCompositeType = diagram.customTypes?.find(
                (ct) =>
                    ct.name === field.type.name &&
                    ct.kind === 'composite' &&
                    (ct.schema ? ct.schema === table.schema : true)
            );

            if (customCompositeType) {
                typeName = customCompositeType.schema
                    ? `${customCompositeType.schema}.${customCompositeType.name}`
                    : customCompositeType.name;
            } else if (typeName.toLowerCase() === 'user-defined') {
                // If it's 'user-defined' but not a known composite, fallback to TEXT
                typeName = 'text';
            }

            // Temp fix for 'array' to be text[]
            if (typeName.toLowerCase() === 'array') {
                typeName = 'text[]';
            }

            sqlScript += `  ${field.name} ${typeName}`;

            // Add size for character types
            if (
                field.characterMaximumLength &&
                parseInt(field.characterMaximumLength) > 0
            ) {
                sqlScript += `(${field.characterMaximumLength})`;
            } else if (field.type.name.toLowerCase().includes('varchar')) {
                // Keep varchar sizing, but don't apply to TEXT (previously enum)
                sqlScript += `(500)`;
            }

            // Add precision and scale for numeric types
            if (field.precision && field.scale) {
                sqlScript += `(${field.precision}, ${field.scale})`;
            } else if (field.precision) {
                sqlScript += `(${field.precision})`;
            }

            // Handle NOT NULL constraint
            if (!field.nullable) {
                sqlScript += ' NOT NULL';
            }

            // Handle UNIQUE value
            if (!field.primaryKey && field.unique) {
                sqlScript += ` UNIQUE`;
            }

            // Handle DEFAULT value
            if (field.default) {
                // Temp remove default user-define value when it have it
                let fieldDefault = field.default;

                // Remove the type cast part after :: if it exists
                if (fieldDefault.includes('::')) {
                    const endedWithParentheses = fieldDefault.endsWith(')');
                    fieldDefault = fieldDefault.split('::')[0];

                    if (
                        (fieldDefault.startsWith('(') &&
                            !fieldDefault.endsWith(')')) ||
                        endedWithParentheses
                    ) {
                        fieldDefault += ')';
                    }
                }

                if (fieldDefault === `('now')`) {
                    fieldDefault = `now()`;
                }

                sqlScript += ` DEFAULT ${fieldDefault}`;
            }

            // Handle PRIMARY KEY constraint
            if (field.primaryKey) {
                sqlScript += ' PRIMARY KEY';
            }

            // Add a comma after each field except the last one
            if (index < table.fields.length - 1) {
                sqlScript += ',\n';
            }
        });

        sqlScript += '\n);\n\n';

        // Add table comment
        if (table.comments) {
            sqlScript += `COMMENT ON TABLE ${tableName} IS '${table.comments}';\n`;
        }

        table.fields.forEach((field) => {
            // Add column comment
            if (field.comments) {
                sqlScript += `COMMENT ON COLUMN ${tableName}.${field.name} IS '${field.comments}';\n`;
            }
        });

        // Generate SQL for indexes
        table.indexes.forEach((index) => {
            const fieldNames = index.fieldIds
                .map(
                    (fieldId) =>
                        table.fields.find((field) => field.id === fieldId)?.name
                )
                .filter(Boolean)
                .join(', ');

            if (fieldNames) {
                const indexName = table.schema
                    ? `${table.schema}_${index.name}`
                    : index.name;
                sqlScript += `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${indexName} ON ${tableName} (${fieldNames});\n`;
            }
        });

        sqlScript += '\n';
    });

    // Handle relationships (foreign keys)
    relationships?.forEach((relationship) => {
        const sourceTable = nonViewTables.find(
            (table) => table.id === relationship.sourceTableId
        );
        const targetTable = nonViewTables.find(
            (table) => table.id === relationship.targetTableId
        );

        const sourceTableField = sourceTable?.fields.find(
            (field) => field.id === relationship.sourceFieldId
        );
        const targetTableField = targetTable?.fields.find(
            (field) => field.id === relationship.targetFieldId
        );

        if (
            sourceTable &&
            targetTable &&
            sourceTableField &&
            targetTableField
        ) {
            const sourceTableName = sourceTable.schema
                ? `${sourceTable.schema}.${sourceTable.name}`
                : sourceTable.name;
            const targetTableName = targetTable.schema
                ? `${targetTable.schema}.${targetTable.name}`
                : targetTable.name;
            sqlScript += `ALTER TABLE ${sourceTableName} ADD CONSTRAINT ${relationship.name} FOREIGN KEY (${sourceTableField.name}) REFERENCES ${targetTableName} (${targetTableField.name});\n`;
        }
    });

    return sqlScript;
};

export const exportSQL = (diagram: Diagram, databaseType: DatabaseType) => {
    const sqlScript = exportBaseSQL({
        diagram,
        targetDatabaseType: databaseType,
    });
    return sqlScript;

    // if (databaseType === diagram.databaseType) {
    //     return sqlScript;
    // }
    // const cacheKey = await generateCacheKey(databaseType, sqlScript);
    // const cachedResult = getFromCache(cacheKey);
    // if (cachedResult) {
    //     return cachedResult;
    // }
    // REMOVED AI JUNK
};

function getMySQLDataTypeSize(type: DataType) {
    return (
        {
            tinyint: 1,
            smallint: 2,
            mediumint: 3,
            integer: 4,
            bigint: 8,
            float: 4,
            double: 8,
            decimal: 16,
            numeric: 16,
            // Add other relevant data types if needed
        }[type.name.toLowerCase()] || 0
    );
}

function alignForeignKeyDataTypes(diagram: Diagram) {
    const { tables, relationships } = diagram;

    if (
        !tables ||
        tables.length === 0 ||
        !relationships ||
        relationships.length === 0
    ) {
        return;
    }

    // Convert tables to a map for quick lookup
    const tableMap = new Map<string, DBTable>();
    tables.forEach((table) => {
        tableMap.set(table.id, table);
    });

    // Iterate through each relationship to update the child table column data types
    relationships.forEach((relationship) => {
        const { sourceTableId, sourceFieldId, targetTableId, targetFieldId } =
            relationship;

        const sourceTable = tableMap.get(sourceTableId);
        const targetTable = tableMap.get(targetTableId);

        if (sourceTable && targetTable) {
            const sourceField = sourceTable.fields.find(
                (field: { id: string }) => field.id === sourceFieldId
            );
            const targetField = targetTable.fields.find(
                (field: { id: string }) => field.id === targetFieldId
            );

            if (sourceField && targetField) {
                const sourceSize = getMySQLDataTypeSize(sourceField.type);
                const targetSize = getMySQLDataTypeSize(targetField.type);

                if (sourceSize > targetSize) {
                    // Adjust the child field data type to the larger data type
                    targetField.type = sourceField.type;
                } else if (targetSize > sourceSize) {
                    // Adjust the child field data type to the larger data type
                    sourceField.type = targetField.type;
                }
            }
        }
    });
}
