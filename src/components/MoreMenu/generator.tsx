import API from "@/services/API";
import { IBlog as Blog } from "@/commonlib/types/blog";
import BlogStatus from "@/commonlib/types/blogStatus";
import { CustomError } from "@/commonlib/types/frontend/contextTypes";
import Permission from "@/commonlib/types/permissions";
import { NavigateFunction } from "react-router-dom";
import { toast } from "react-toastify";
import { Option } from ".";

interface MoreMenuGeneratorProps {
  blog: Blog;
  navigate: NavigateFunction;
  fetchBlogs: () => void;
  setError: (error: CustomError) => void;
  toast: typeof toast;
}

export function moreMenuOptionsGenerator({
  navigate,
  blog,
  setError,
  fetchBlogs,
  toast,
}: MoreMenuGeneratorProps): Option[] {
  const handleDelete = (blogId: string) => {
    const choice = window.confirm(
      "Are you sure you want to delete this story?",
    );
    if (choice) {
      const deleteEndPoint = `/blog/delete-blog/${blogId}`;

      API.delete(deleteEndPoint)
        .then(() => {
          toast.success("Successfully deleted");
          fetchBlogs();
        })
        .catch((e) => setError(e));
      console.debug("story deleted");
    }
  };

  const handleEdit = (blogId: string) => {
    //TODO edit blog, should open the blog on the new blog view
    console.debug(blogId);
    API.get(`/blog/get-blog/${blogId}`)
      .then((blogResponse) => {
        const blogDetails = blogResponse.data.data;
        navigate("/story/new-story", { state: { key: blogDetails } });
      })
      .catch((e) => setError(e));
    console.debug("story edited");
  };

  const handleSubmit = (blogId: string) => {
    const choice = window.confirm(
      "Are you sure you want to submit this story for approval?",
    );
    if (choice) {
      API.put(`/blog/submit-for-approval/${blogId}`)
        .then((_) => {
          toast.success("Successfully submitted for approval!");
          fetchBlogs();
        })
        .catch((e) => setError(e));
      console.debug("story submitted");
    }
  };

  const handleArchive = (blogId: string, make_pending: boolean = false) => {
    //archive is same as takedown dw
    const choice = window.confirm(
      make_pending
        ? "Are you sure you want to make this story as 'Pending'?"
        : "Are you sure you want to move this story back to author's draft?",
    );
    if (choice) {
      const archiveEndPoint = `/blog/take-down-blog/${blogId}`;

      API.put(archiveEndPoint, {
        make_pending: make_pending,
      })
        .then(() => {
          toast.success("Successfully archived");
          fetchBlogs();
        })
        .catch((e) => setError(e));
      console.debug("story archived");
    }
  };

  const handlePublishNow = () => {
    const choice = window.confirm(
      "Are you sure you want to publish this story?",
    );
    if (choice) {
      const publishEndPoint = `/blog/publish-blog/${blog._id}`;

      API.put(publishEndPoint)
        .then(() => {
          toast.success("Successfully published");
          navigate(0);
        })
        .catch((e) => setError(e));
    }
  };

  const more_menu_options: Option[] = [
    {
      label: "Read",
      handler: () => navigate(`/story/${blog._id}`),
      show: true,
      permissions: [Permission.ReadBlog],
    },
    {
      label: "Delete",
      handler: handleDelete,
      show: blog.status !== BlogStatus.Draft,
      permissions: [Permission.DeleteBlog],
    },
    {
      label: "Delete",
      handler: handleDelete,
      show: blog.status == BlogStatus.Draft,
      permissions: [],
    },
    {
      label: "Draft blog",
      handler: (id) => handleArchive(id),
      show: blog.status === BlogStatus.Pending,
      permissions: [],
    },
    {
      label: "Make Pending",
      handler: (id) => handleArchive(id, true),
      show:
        blog.status === BlogStatus.Published ||
        blog.status === BlogStatus.Approved,
      permissions: [Permission.DeleteBlog],
    },
    {
      label: "Make Draft",
      handler: (id) => handleArchive(id),
      show:
        blog.status === BlogStatus.Approved ||
        blog.status === BlogStatus.Published,
      permissions: [Permission.DeleteBlog],
    },
    {
      label: "Edit",
      handler: handleEdit,
      show:
        blog.status === BlogStatus.Approved ||
        blog.status === BlogStatus.Pending,
      permissions: [Permission.EditBeforeBlogPublish],
    },
    {
      label: "Edit",
      handler: handleEdit,
      show: blog.status === BlogStatus.Draft,
      permissions: [Permission.UpdateBlog],
    },
    {
      label: "Submit",
      handler: handleSubmit,
      show: blog.status === BlogStatus.Draft,
      permissions: [Permission.CreateBlog],
    },
    {
      label: "Publish",
      handler: handlePublishNow,
      show:
        blog.status === BlogStatus.Pending ||
        blog.status === BlogStatus.Approved,
      permissions: [Permission.PublishBlog],
    },
  ];

  return more_menu_options;
}
