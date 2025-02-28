import MoreVerticalIcon from "@/assets/MoreIcon";
import BlogStatus from "@/commonlib/types/blogStatus";
import { useEffect, useRef, useState } from "react";
import { PermissionProtector } from "../PermissionProtector";
import Permission from "@/commonlib/types/permissions";

export interface Option {
  label: string;
  handler: (blogId: string, status: BlogStatus) => void;
  show: boolean;
  permissions: Permission[];
}

export interface MoreMenuProps {
  options: Option[];
  blogId: string;
}

const enum MenuDirection {
  Up,
  Down,
}

//please stick to passing options/function which do something tangible for user because the moremenu needs to close
//after one click on it
export default function MoreMenu({ options, blogId }: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState(MenuDirection.Down);
  const menuRef = useRef(null);

  const handleOptionFunction = (handler) => {
    console.debug(blogId);
    handler(blogId);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);

    // Check if the menu is in the lower half of the viewport
    if (
      menuRef.current.getBoundingClientRect().top >
      window.innerHeight * 0.75
    ) {
      setMenuDirection(MenuDirection.Up);
    } else {
      setMenuDirection(MenuDirection.Down);
    }
  };

  useEffect(() => {
    //function to handle clicks
    function handleOutsideClicks(e: MouseEvent) {
      //menuref should be initialized ofc and then checking for any click outside more menu , if so close it
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    //adding event listener on component mount
    document.addEventListener("mousedown", handleOutsideClicks);
    return () => {
      // removing the listener once the component unmounts
      document.removeEventListener("mousedown", handleOutsideClicks);
    };
  }, []);

  return (
    // attaching the ref
    <div className="relative text-left" ref={menuRef}>
      <div>
        <button
          onClick={toggleMenu}
          type="button"
          className="px-2 py-1  text-black"
        >
          <MoreVerticalIcon />
        </button>
      </div>
      {isOpen && (
        <div
          className={`z-10 origin-top-right w-max absolute ${
            menuDirection === MenuDirection.Up ? "bottom-full" : "top-full"
          } bg-gray-200 rounded-md shadow-md`}
        >
          {options
            .filter((option) => option.show)
            .map((option, index) => (
              <PermissionProtector
                key={index}
                fallback={true}
                permission={option.permissions}
              >
                <button
                  className="w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => handleOptionFunction(option.handler)}
                >
                  {option.label}
                </button>
              </PermissionProtector>
            ))}
          {/* {!(status == BlogStatus.Published || status == BlogStatus.Approved) && (
            <button
              className="w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={handleEdit}
            >
              Edit
            </button>
          )}

          <button
            className="w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleDelete}
          >
            Delete
          </button>

          {
            (status == BlogStatus.Published || status == BlogStatus.Approved || status == BlogStatus.Pending) ?
              <PermissionProtector silent={true} permission={[Permission.DeleteBlog]}>
                <button
                  className="w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  onClick={handleArchive}
                >
                  Archive
                </button>
              </PermissionProtector>
              : <></>
          }

          {
            (status == BlogStatus.Draft) ?
              <button
                className="w-full block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                onClick={handleSubmit}
              >
                Submit
              </button> : <></>
          }*/}
        </div>
      )}
    </div>
  );
}
