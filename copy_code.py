import os

files_to_copy = ['index.html', 'style.css', 'script.js']
output_file = 'calculator_code.txt'

with open(output_file, 'w', encoding='utf-8') as outfile:
    for filename in files_to_copy:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as infile:
                outfile.write(f"--- START OF {filename} ---\n")
                outfile.write(infile.read())
                outfile.write(f"\n--- END OF {filename} ---\n\n")
            print(f"Added {filename} to {output_file}")
        else:
            print(f"Warning: {filename} not found.")

print(f"All code has been combined into {output_file}")
