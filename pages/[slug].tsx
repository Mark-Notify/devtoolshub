import type { GetServerSideProps, NextPage } from "next";
import Jwtdecode from "../components/Jwt/Jwtdecode";
import QRCodeGen from "../components/QRCode/QRCodeGen";
import JsonToXml from "../components/JsonFormat/JsonToXml";
import JsonToXmlVertical from "../components/JsonFormat/JsonToXmlVertical";
import JsonFormat from "../components/JsonFormat/JsonFormat";
import JsonFormatVertical from "../components/JsonFormat/JsonFormatVertical";
import ProfilePage from "../components/ProfilePage";
import CommonLayout from "../components/Layout";
import TermsAndConditions from "../components/terms-and-conditions";
import Base64 from "../components/base64";
import MorseCode from "../components/MorseCode";
import HtmlEditorPage from "../components/HtmlEditor";
import UrlEncodeDecode from "../components/UrlEncodeDecode";
import HashGenerator from "../components/HashGenerator";
import DiffChecker from "../components/DiffChecker";
import TimestampConverter from "../components/TimestampConverter";
import YamlJson from "../components/YamlJson";
import RegexTester from "../components/RegexTester";
import UuidGenerator from "../components/UuidGenerator";
import SqlFormatter from "../components/SqlFormatter";
import JsonToCsv from "../components/JsonToCsv";
import ColorConverter from "../components/ColorConverter";
import PasswordGenerator from "../components/PasswordGenerator";
import NumberBase from "../components/NumberBase";
import ThaiEngKeyboard from "../components/ThaiEngKeyboard";
import Seo from "../components/Seo";
import { getSeo, TOOLS_SEO } from "../const/seo";

type Props = {
  slug: string;
  seo: ReturnType<typeof getSeo>;
  isTool: boolean;
  index: boolean;
};

const SlugPage: NextPage<Props> = ({ slug, seo, isTool, index }) => {
  const renderComponent = () => {
    switch (slug) {
      case "json-format":
        return <JsonFormat />;
      case "json-format-vertical":
        return <JsonFormatVertical />;
      case "xml-to-json":
        return <JsonToXml />;
      case "xml-to-json-vertical":
        return <JsonToXmlVertical />;
      case "jwt-decode":
        return <Jwtdecode />;
      case "qr-code-generator":
        return <QRCodeGen />;
      case "base64":
        return <Base64 />;
      case "morse-code-decoder":
        return <MorseCode />;
      case "html-render":
        return <HtmlEditorPage />;
      case "url-encode-decode":
        return <UrlEncodeDecode />;
      case "hash-generator":
        return <HashGenerator />;
      case "diff-checker":
        return <DiffChecker />;
      case "timestamp-converter":
        return <TimestampConverter />;
      case "yaml-json":
        return <YamlJson />;
      case "regex-tester":
        return <RegexTester />;
      case "uuid-generator":
        return <UuidGenerator />;
      case "sql-formatter":
        return <SqlFormatter />;
      case "json-to-csv":
        return <JsonToCsv />;
      case "color-converter":
        return <ColorConverter />;
      case "password-generator":
        return <PasswordGenerator />;
      case "number-base":
        return <NumberBase />;
      case "thai-eng-keyboard":
        return <ThaiEngKeyboard />;
      case "profile":
        return <ProfilePage />;
      case "terms-and-conditions":
        return <TermsAndConditions />;
      default:
        return <JsonFormat />;
    }
  };

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        url={seo.url}
        canonical={seo.canonical}
        keywords={seo.keywords}
        isTool={isTool}
        index={index}
      />
      <CommonLayout>
        <div className="flex-1 flex flex-col overflow-hidden">{renderComponent()}</div>
      </CommonLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = (Array.isArray(params?.slug) ? params?.slug[0] : params?.slug) || "";
  const entry = TOOLS_SEO[slug];
  const seo = getSeo(slug);
  // a "tool" is any known slug that should be indexed (excludes profile / terms)
  const index = entry ? entry.index !== false : true;
  const isTool = Boolean(entry) && index;
  return { props: { slug, seo, isTool, index } };
};

export default SlugPage;
