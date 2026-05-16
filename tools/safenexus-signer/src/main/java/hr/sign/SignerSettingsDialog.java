package hr.sign;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JDialog;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.io.File;
import java.util.Properties;

public final class SignerSettingsDialog {
    private SignerSettingsDialog() {
    }

    public static void open() {
        Runnable task = () -> {
            try {
                showDialog();
            } catch (Exception error) {
                JOptionPane.showMessageDialog(
                        null,
                        "Settings se ne mogu otvoriti: " + safeMessage(error),
                        "SafeNexus PDF Signer",
                        JOptionPane.ERROR_MESSAGE
                );
            }
        };
        if (SwingUtilities.isEventDispatchThread()) {
            task.run();
        } else {
            try {
                SwingUtilities.invokeAndWait(task);
            } catch (Exception error) {
                throw new IllegalStateException("Settings prozor se ne moze otvoriti.", error);
            }
        }
    }

    private static void showDialog() {
        Properties properties = SignerConfig.loadRawProperties();

        JTextArea allowlist = new JTextArea(properties.getProperty("api.allowlist", "https://safe-nexus.org"), 4, 44);
        JTextField pdfFolder = new JTextField(properties.getProperty("pdf.folder", "C:/Users/Branimir/Desktop/ZaPotpis"), 32);
        JTextField keyword = new JTextField(firstNonBlank(properties.getProperty("keyword", ""), properties.getProperty("fallback.keyword", "")), 32);
        JCheckBox caseInsensitive = new JCheckBox("Trazi bez razlikovanja velikih/malih slova");
        caseInsensitive.setSelected(Boolean.parseBoolean(properties.getProperty("case.insensitive", "true")));
        JTextField providerOrder = new JTextField(properties.getProperty("providers.order", "EOI,FINA"), 32);
        JTextField eoiPath = new JTextField(properties.getProperty("eoi.pkcs11", "C:/Program Files/AKD/Certilia Middleware/pkcs11/AkdEidPkcs11_64.dll"), 32);
        JTextField eoiSlot = new JTextField(properties.getProperty("eoi.slotIndex", ""), 8);
        JTextField finaPath = new JTextField(properties.getProperty("fina.pkcs11", "C:/Windows/System32/eTPKCS11.dll"), 32);
        JTextField finaSlot = new JTextField(properties.getProperty("fina.slotIndex", ""), 8);
        JTextField rectWidth = new JTextField(properties.getProperty("rect.width.cm", "6"), 8);
        JTextField rectHeight = new JTextField(properties.getProperty("rect.height.cm", "2"), 8);
        JTextField offsetDown = new JTextField(properties.getProperty("offset.down.cm", "2.2"), 8);
        JTextField offsetLeft = new JTextField(properties.getProperty("offset.left.cm", "2.6"), 8);
        JTextField fontSize = new JTextField(properties.getProperty("font.size", "7.5"), 8);
        JTextField reason = new JTextField(properties.getProperty("reason", "Digitalni potpis"), 32);
        JTextField location = new JTextField(properties.getProperty("location", "Hrvatska"), 32);
        JCheckBox skipAlreadySigned = new JCheckBox("Preskoci ako je vec potpisano");
        skipAlreadySigned.setSelected(Boolean.parseBoolean(properties.getProperty("skip.already.signed", "true")));
        JTextField skipTolerance = new JTextField(properties.getProperty("skip.tolerance.pt", "12"), 8);
        JCheckBox previewHideAlreadySigned = new JCheckBox("Sakrij vec potpisane lokacije u previewu");
        previewHideAlreadySigned.setSelected(Boolean.parseBoolean(properties.getProperty("preview.hide.already.signed", "false")));

        JPanel fields = new JPanel(new GridBagLayout());
        fields.setBorder(BorderFactory.createEmptyBorder(16, 16, 8, 16));
        int row = 0;
        row = addRow(fields, row, "Potpis", new JLabel("Stvarni digitalni potpis je ukljucen."), null);
        row = addRow(fields, row, "API allowlist", new JScrollPane(allowlist), null);
        row = addRow(fields, row, "PDF folder", pdfFolder, null);
        row = addRow(fields, row, "Keyword fallback", keyword, null);
        row = addRow(fields, row, "Case insensitive", caseInsensitive, null);
        row = addRow(fields, row, "Provider order", providerOrder, null);
        row = addRow(fields, row, "eOI PKCS#11", eoiPath, browseButton(eoiPath));
        row = addRow(fields, row, "eOI slot", eoiSlot, null);
        row = addRow(fields, row, "FINA PKCS#11", finaPath, browseButton(finaPath));
        row = addRow(fields, row, "FINA slot", finaSlot, null);
        row = addRow(fields, row, "Rect width cm", rectWidth, null);
        row = addRow(fields, row, "Rect height cm", rectHeight, null);
        row = addRow(fields, row, "Offset down cm", offsetDown, null);
        row = addRow(fields, row, "Offset left cm", offsetLeft, null);
        row = addRow(fields, row, "Font size", fontSize, null);
        row = addRow(fields, row, "Reason", reason, null);
        row = addRow(fields, row, "Location", location, null);
        row = addRow(fields, row, "Skip already signed", skipAlreadySigned, null);
        row = addRow(fields, row, "Skip tolerance pt", skipTolerance, null);
        row = addRow(fields, row, "Preview hide signed", previewHideAlreadySigned, null);
        addRow(fields, row, "PIN", new JLabel("PIN se unosi samo lokalno pri potpisu i ne sprema se."), null);

        JButton save = new JButton("Spremi");
        JButton close = new JButton("Zatvori");

        JDialog dialog = new JDialog((java.awt.Frame) null, "SafeNexus PDF Signer Settings", true);
        save.addActionListener(event -> {
            try {
                SignerConfig.saveRawProperties(toProperties(properties, allowlist, pdfFolder, keyword, caseInsensitive, providerOrder, eoiPath, eoiSlot, finaPath, finaSlot, rectWidth, rectHeight, offsetDown, offsetLeft, fontSize, reason, location, skipAlreadySigned, skipTolerance, previewHideAlreadySigned));
                JOptionPane.showMessageDialog(dialog, "Settings su spremljeni.\nPIN nije spremljen.", "SafeNexus PDF Signer", JOptionPane.INFORMATION_MESSAGE);
            } catch (Exception error) {
                JOptionPane.showMessageDialog(dialog, safeMessage(error), "SafeNexus PDF Signer", JOptionPane.ERROR_MESSAGE);
            }
        });
        close.addActionListener(event -> dialog.dispose());

        JPanel buttons = new JPanel();
        buttons.add(save);
        buttons.add(close);

        JPanel root = new JPanel(new BorderLayout());
        root.add(new JScrollPane(fields), BorderLayout.CENTER);
        root.add(buttons, BorderLayout.SOUTH);

        dialog.setContentPane(root);
        dialog.setMinimumSize(new Dimension(820, 680));
        dialog.setLocationRelativeTo(null);
        dialog.setVisible(true);
    }

    private static Properties toProperties(
            Properties original,
            JTextArea allowlist,
            JTextField pdfFolder,
            JTextField keyword,
            JCheckBox caseInsensitive,
            JTextField providerOrder,
            JTextField eoiPath,
            JTextField eoiSlot,
            JTextField finaPath,
            JTextField finaSlot,
            JTextField rectWidth,
            JTextField rectHeight,
            JTextField offsetDown,
            JTextField offsetLeft,
            JTextField fontSize,
            JTextField reason,
            JTextField location,
            JCheckBox skipAlreadySigned,
            JTextField skipTolerance,
            JCheckBox previewHideAlreadySigned
    ) {
        Properties out = new Properties();
        out.putAll(original);
        out.setProperty("signer.mode", "real");
        out.setProperty("real.dryRun", "false");
        out.setProperty("api.allowlist", allowlist.getText().trim());
        out.setProperty("pdf.folder", pdfFolder.getText().trim());
        out.setProperty("keyword", keyword.getText().trim());
        out.setProperty("case.insensitive", Boolean.toString(caseInsensitive.isSelected()));
        out.setProperty("fallback.keyword", keyword.getText().trim());
        out.setProperty("fallback.case.insensitive", Boolean.toString(caseInsensitive.isSelected()));
        out.setProperty("providers.order", providerOrder.getText().trim());
        out.setProperty("eoi.pkcs11", eoiPath.getText().trim());
        out.setProperty("eoi.slotIndex", eoiSlot.getText().trim());
        out.setProperty("fina.pkcs11", finaPath.getText().trim());
        out.setProperty("fina.slotIndex", finaSlot.getText().trim());
        out.setProperty("rect.width.cm", rectWidth.getText().trim());
        out.setProperty("rect.height.cm", rectHeight.getText().trim());
        out.setProperty("offset.down.cm", offsetDown.getText().trim());
        out.setProperty("offset.left.cm", offsetLeft.getText().trim());
        out.setProperty("font.size", fontSize.getText().trim());
        out.setProperty("reason", reason.getText().trim());
        out.setProperty("location", location.getText().trim());
        out.setProperty("skip.already.signed", Boolean.toString(skipAlreadySigned.isSelected()));
        out.setProperty("skip.tolerance.pt", skipTolerance.getText().trim());
        out.setProperty("preview.hide.already.signed", Boolean.toString(previewHideAlreadySigned.isSelected()));
        out.remove("eoi.pin");
        out.remove("fina.pin");
        out.remove("pin");
        return out;
    }

    private static int addRow(JPanel panel, int row, String label, java.awt.Component field, java.awt.Component trailing) {
        GridBagConstraints labelConstraints = new GridBagConstraints();
        labelConstraints.gridx = 0;
        labelConstraints.gridy = row;
        labelConstraints.anchor = GridBagConstraints.WEST;
        labelConstraints.insets = new Insets(6, 0, 6, 12);
        panel.add(new JLabel(label), labelConstraints);

        GridBagConstraints fieldConstraints = new GridBagConstraints();
        fieldConstraints.gridx = 1;
        fieldConstraints.gridy = row;
        fieldConstraints.weightx = 1;
        fieldConstraints.fill = GridBagConstraints.HORIZONTAL;
        fieldConstraints.insets = new Insets(6, 0, 6, 8);
        panel.add(field, fieldConstraints);

        if (trailing != null) {
            GridBagConstraints trailingConstraints = new GridBagConstraints();
            trailingConstraints.gridx = 2;
            trailingConstraints.gridy = row;
            trailingConstraints.insets = new Insets(6, 0, 6, 0);
            panel.add(trailing, trailingConstraints);
        }
        return row + 1;
    }

    private static JButton browseButton(JTextField target) {
        JButton button = new JButton("...");
        button.addActionListener(event -> {
            JFileChooser chooser = new JFileChooser();
            chooser.setFileSelectionMode(JFileChooser.FILES_ONLY);
            String current = target.getText().trim();
            if (!current.isBlank()) {
                chooser.setSelectedFile(new File(current));
            }
            if (chooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) {
                target.setText(chooser.getSelectedFile().getAbsolutePath());
            }
        });
        return button;
    }

    private static String safeMessage(Throwable error) {
        String message = error == null ? "" : error.getMessage();
        return message == null || message.isBlank() ? "Neocekivana greska." : message;
    }

    private static String firstNonBlank(String first, String second) {
        String cleanFirst = String.valueOf(first == null ? "" : first).trim();
        return cleanFirst.isBlank() ? String.valueOf(second == null ? "" : second).trim() : cleanFirst;
    }
}
