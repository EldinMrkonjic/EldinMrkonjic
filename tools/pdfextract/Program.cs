using System;
using System.IO;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;

class Program
{
    static int Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.Error.WriteLine("Usage: PdfExtract <pdfPath> [<outPath>]");
            return 1;
        }
        var pdfPath = args[0];
        var outPath = args.Length > 1 ? args[1] : Path.ChangeExtension(pdfPath, ".txt");
        try
        {
            using var reader = new PdfReader(pdfPath);
            using var pdf = new PdfDocument(reader);
            using var writer = new StreamWriter(outPath, false, System.Text.Encoding.UTF8);
            int pages = pdf.GetNumberOfPages();
            for (int i = 1; i <= pages; i++)
            {
                var page = pdf.GetPage(i);
                var strategy = new LocationTextExtractionStrategy();
                string text = PdfTextExtractor.GetTextFromPage(page, strategy);
                writer.WriteLine($"\n===== PAGE {i} / {pages} =====\n");
                writer.WriteLine(text);
            }
            Console.WriteLine($"Wrote: {outPath}");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("Error: " + ex.Message);
            return 2;
        }
    }
}
