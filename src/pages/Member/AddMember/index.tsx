import { Spinner } from "@/components/Spinner";
import { ErrorContext } from "@/contexts/error";
import API from "@/services/API";
import React from "react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import {
  FaTimes,
  FaFileCsv,
  FaCloudUploadAlt,
  FaDownload,
} from "react-icons/fa";

interface Role {
  role_id: string;
  role_name: string;
}

export default function AddMember() {
  const { setError } = React.useContext(ErrorContext);
  const [loading, setLoading] = React.useState(false);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [role, setRole] = React.useState<string>("");
  const [csvFiles, setCsvFiles] = React.useState<File[]>([]);
  const [isMultiMember, setIsMultiMember] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await API.get("/role");
        setRoles(response.data.data);
      } catch (err: any) {
        setError(err);
        toast.error(err?.message || "Failed to fetch roles");
      }
    };
    fetchRoles();
  }, [setError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (isMultiMember) {
      handleCsvUpload();
    } else {
      handleSingleMemberAdd(e);
    }
  };

  const handleSingleMemberAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    if (!role) {
      toast.error("Please select a role");
      setLoading(false);
      return;
    }

    try {
      await API.post("/auth/signup", { name, username: email, teamRole: role });
      toast.success("Member added successfully");
      setRole("");
      form.reset();
    } catch (err: any) {
      setError(err);
      toast.error(err?.message || "Error adding member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = () => {
    if (csvFiles.length === 0) {
      toast.error("Please select at least one CSV file");
      setLoading(false);
      return;
    }

    let processedCount = 0;
    const totalFiles = csvFiles.length;
    const errors: string[] = [];

    csvFiles.forEach((file, fileIndex) => {
      Papa.parse(file, {
        complete: async (results) => {
          const data = results.data as Record<string, string>[];
          const skippedRows: number[] = [];
          const userData = [];

          for (let i = 0; i < data.length; i++) {
            const { name, email, role } = data[i];
            if (!name || !email || !role) {
              skippedRows.push(i + 1);
              continue;
            }

            const matchedRole = roles.find(
              (r) => r.role_name.toLowerCase() === role.toLowerCase()
            );

            if (!matchedRole) {
              errors.push(
                `Invalid role for ${name}: ${role} in file ${file.name}`
              );
              continue;
            }

            userData.push({
              name: name,
              email: email,
              role: role,
            });
          }

          try {
            await API.post("/auth/post-add-users", { users: userData });
          } catch (e) {
            console.log(e);
          }

          if (skippedRows.length > 0) {
            toast.warning(
              `The following rows were skipped in ${file.name} due to missing fields: ${skippedRows.join(", ")}`
            );
          }

          processedCount++;
          if (processedCount === totalFiles) {
            if (errors.length > 0) {
              toast.error(errors.join("\n"));
            }
            setLoading(false);
            setCsvFiles([]);
          }
        },
        header: true,
      });
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      ["name", "email", "role"],
      ...roles.map((role) => ["John", "john@doe.com", role.role_name]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      sampleData.map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "text/csv"
    );
    if (droppedFiles.length === 0) {
      toast.error("Please drop only CSV files");
      return;
    }
    setCsvFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter(
      (file) => file.type === "text/csv"
    );
    if (newFiles.length === 0) {
      toast.error("Please select only CSV files");
      return;
    }
    setCsvFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleFileDelete = (indexToDelete: number) => {
    setCsvFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToDelete)
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex flex-grow w-full h-screen justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-10 p-8 shadow rounded">
      <h1>Create Member</h1>
      <p className="text-lg mt-4 mb-10">
        Welcome a new member to the DTU Times team.
      </p>

      {/* Toggle Section */}
      <div className="flex items-center mb-6">
        <label className="mr-3 text-xl font-medium">Mode:</label>
        <button
          type="button"
          onClick={() => setIsMultiMember(false)}
          className={`px-4 py-2 rounded-l ${
            !isMultiMember ? "bg-indigo-500 text-white" : "bg-gray-200"
          }`}
        >
          Create Single Member
        </button>
        <button
          type="button"
          onClick={() => setIsMultiMember(true)}
          className={`px-4 py-2 rounded-r ${
            isMultiMember ? "bg-indigo-500 text-white" : "bg-gray-200"
          }`}
        >
          Create Multi Members (CSV)
        </button>
      </div>

      {/* Form Section */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {!isMultiMember ? (
          // Single Member Form
          <div className="flex flex-col">
            <label
              className="text-2xl font-medium leading-none mb-2"
              htmlFor="name"
            >
              Name
            </label>
            <input
              className="name border p-2 rounded"
              type="text"
              id="name"
              placeholder="Enter name"
              name="name"
              pattern="[A-Za-z/s]+"
              title="Only alphabetical names are allowed"
            />
            <label
              className="text-2xl font-medium leading-none mb-2 mt-6"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="name border p-2 rounded"
              type="email"
              id="email"
              placeholder="Enter email"
              name="email"
            />
            <label
              className="text-2xl font-medium leading-none mb-2 mt-6"
              htmlFor="role"
            >
              Declare Role
            </label>
            <select
              className="name border p-2 rounded"
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="" disabled>
                Select Role
              </option>
              {roles.map((roleOption) => (
                <option key={roleOption.role_id} value={roleOption.role_id}>
                  {roleOption.role_name.charAt(0).toUpperCase() +
                    roleOption.role_name.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // Multi-Member CSV Upload Form
          <div className="flex flex-col space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ease-in-out
                ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <FaCloudUploadAlt className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your CSV files here
                </p>
                <p className="text-gray-500 text-sm mb-4">or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="csv"
                  accept=".csv"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-gray-500 text-sm mt-4">
                  Only CSV files are allowed
                </p>
              </div>
            </div>

            {csvFiles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Uploaded Files
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {csvFiles.map((file, index) => (
                    <div
                      key={index}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <FaFileCsv className="w-6 h-6 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaDownload className="mr-2" />
                Download Sample CSV
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          className={`update-button bg-gray-50 text-black hover:bg-indigo-500 border p-3 rounded text-xl mt-4`}
          type="submit"
        >
          {isMultiMember ? "Upload CSV" : "Register"}
        </button>
      </form>
    </div>
  );
}
