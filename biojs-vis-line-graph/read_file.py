import csv

fileName = "/home/ariane/Documents/stemformatics/bio-js-box-plot/many_example.csv" #raw_input("Enter dataset to format: ")
csvPath = "/home/ariane/Documents/stemformatics/bio-js-box-plot/test_many.tsv" #raw_input("Enter new file name: ")

csvFile = open(csvPath, 'wb')
csvWrite = csv.writer(csvFile)

with open(fileName, 'rb') as csvfile:
    dataParser = csv.reader(csvfile, delimiter=',', quotechar='|')
    rowCount = 0
    header = ""
    for rowNames in dataParser:
        row = []
        for i in rowNames:
            i = i[1:-1]
            row.append(i)
        rowCount = rowCount + 1;
        if (rowCount == 1):
            rowHeader = row[1:]
            csvWrite.writerow(["Probe" , "Sample_Type" , "Disease_State", "Sample_ID" , "Expression_Value"])
        else:
            sampleID = "" 
            name1 = row[0]
            name = name1.split(" - ")
            probe = name[0]
            other = name[1].split("_")
            sampleType = other[0] #name[1].split("_")[0] #name[1].split(" ")[0] + " " + name[1].split(" ")[1] + " " + name[1].split(" ")[2]
            diseaseState = other[1]
            sampleID = other[2] + " " + other[3]
            print probe + "," + sampleType + "," + sampleID + "," + row[1]
            csvWrite.writerow([probe , sampleType , diseaseState, sampleID , row[1]])
csvFile.close()
