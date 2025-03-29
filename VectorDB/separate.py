import os
import shutil

def copy_ps_pdfs(base_dir):
    # Create the destination folder named "index" inside base_dir
    index_dir = os.path.join(base_dir, "index")
    if not os.path.exists(index_dir):
        os.makedirs(index_dir)
    
    # Walk through the directory structure
    for root, dirs, files in os.walk(base_dir):
        # Skip the index folder to avoid copying files from it
        if index_dir in [os.path.join(root, d) for d in dirs]:
            dirs.remove(os.path.basename(index_dir))
        for file in files:
            # Check if the file is a PDF and contains "ps" in its name (case-insensitive)
            if file.lower().endswith(".pdf") and "ps" in file.lower():
                source_path = os.path.join(root, file)
                dest_path = os.path.join(index_dir, file)
                print(f"Copying: {source_path} -> {dest_path}")
                shutil.copy2(source_path, dest_path)

if __name__ == "__main__":
    # Assuming the script is run from the same directory that contains the "Textbooks" folder
    base_directory = "Textbooks"
    copy_ps_pdfs(base_directory)
