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
    sqlScript += '\n';

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
            if (typeName.toLowerCase() === 'enum') {
                // Map enum to TEXT for broader compatibility, especially with DBML importer
                typeName = 'text';
            }

            // Temp fix for 'array' to be text[]
            if (typeName.toLowerCase() === 'array') {
                typeName = 'text[]';
            }

            // Temp fix for 'user-defined' to be text
            if (typeName.toLowerCase() === 'user-defined') {
                typeName = 'text';
            }

            sqlScript += `  ${field.name} ${typeName}`;

            // Add size for character types
            if (field.characterMaximumLength) {
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
